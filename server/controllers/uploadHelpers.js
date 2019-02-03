"use strict";
var validator = require('validator');
var mime = require('mime');
var multer = require('multer');

var meta    = {config:{}};
var users = require('./../models/users');
var elements = require('./../models/elements');
var fs = require('fs');
var path = require('path');
var async = require('async');
var nconf = require('nconf');
var winston = require('winston');
var child_process = require("child_process");
var uploadHelpers = {};

var uploadImagePath = nconf.get('upload_path');
var uploadVideoPath = nconf.get('uploadVideo_path');
var imagePath = nconf.get('image_path');
var videoPath = nconf.get('video_path');
var thumbnailPath = nconf.get('thumb_path');
var hostname = nconf.get('url');
var thumbler = require('video-thumb');


const MAX_HEIGHT = 200;
const MAX_WIDTH = 200;
/**
 * Config for upload to S3
 */
var express = require("express");
var AWS = require("aws-sdk");
var mu = require("mu2-updated");
var uuidv4 = require("uuid/v4");
var multiparty = require("multiparty");

const Album_Bucket_Name = 'traceroll-bucket';
const baseURL = 'https://d2w4sqd6q4mas4.cloudfront.net/';
//US East (N. Virginia), Amazon S3 returns an empty string for the bucket's region:s
const Bucket_Region = 'us-east-1';
const IdentityPoolId = 'us-east-1:76a5f0fb-8a49-4dad-82b3-b250339a916c';

AWS.config.update({
    region: Bucket_Region,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IdentityPoolId
    })
});

const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: Album_Bucket_Name }
});

const bucket = Album_Bucket_Name;
if (!bucket || bucket.length < 1) {
    console.error("Missing S3 bucket. Start with node server.js BUCKETNAME instead.");
    process.exit(1);
}

const dev = 'development';
const pro = 'production';

uploadHelpers.upload = function (req, res, next) {
    let env = global.env.trim();

    if (env === dev) {
        uploadLocal(req, res, next);
    } else if (env === pro) {
        uploadS3(req, res, next);
    }
}

var uploadS3 = function(req, res, next) {
    const _ID = (res.req.uid) ? res.req.uid : ( Math.floor(Math.random() * 9999) );
    if (!req.body.src) {
        var form = new multiparty.Form();
        form.on("part", function(file) {
            if (!file) {
                process.exit(1);
                res.status(500).send("File not exits.");
            }
            const type = file.headers["content-type"];
            const elementType = type.substring(0, type.lastIndexOf("/"));
            if (elementType === 'video') {
                let filePathS3;
                //Async waterfall for ffmpeg process
                async.waterfall([
                    function uploadVideo(next) {
                        console.log('Uploading video...');
                        uploadFileS3(false, file, _ID, next);
                    },
                    function createThumb(path, next) {
                        console.log('Creating thumbnail...');
                        filePathS3 = path;
                        generateThumbnail(filePathS3, next);
                    },
                    function uploadThumbnail(thumbnailPath, next) {
                        console.log('Uploading thumbnail...');
                        var thumbnailFileData = fs.createReadStream(thumbnailPath);
                        uploadFileS3(true, thumbnailFileData, _ID, next);
                    }
                ],
                function(err, thumbnailS3Path) {
                    let code = 0;
                    if (err) {
                       code = 1;
                        console.log('Upload video', err)
                    }
                    console.log('Upload finished.')
                    res.status(200).json({ error_code: code,
                        file_path: filePathS3,
                        thumbnail_path: thumbnailS3Path,
                        elementDropType: elementType,
                        path: filePathS3,
                        pathThumb: thumbnailS3Path
                    });
                });
            } else if (elementType === 'image') {
                uploadFileS3(false, file, _ID, function(err, filePathS3) {
                    if (err) {
                        console.log(err);
                        res.status(500).send('Internal server error')
                    } else {
                        res.status(200).json({ error_code: 0,
                            file_path: filePathS3,
                            elementDropType: elementType
                        });
                    }
                })
            }
        });
        form.on('error', function(err) {
            console.log('multiparty ', err)
        })
        form.parse(req);
    }
    else {
        const buf = new Buffer(req.body.src, 'base64')
        uploadFileS3(false, buf, _ID, function(err, filePathS3) {
            if (err) {
                res.json({error_code: 1, error_message: err});
            } else {
                res.json({ error_code: 0,
                    file_path: filePathS3,
                    elementDropType: 'drawing'
                });
            }
        })
    }
}

//Create thumbnail for link video
uploadHelpers.createThumbnailVideo = function(req, res, next){
    const linkVideo = req.body.link;
    const elementType = req.body.elementDropType;

    generateThumbnail(linkVideo, function(err, thumbnailFile){

        const errResult = (err) => {
            console.log("snapshot video can not create");
            res.json({
                error_code: 1,
                error_message: err,
                link: linkVideo,
                thumbnail_path: null,
                elementDropType: elementType
            })
        }

        const successResult = (pathThumb) => {
            console.log("snapshot video created at " + pathThumb)
            res.json({
                error_code: 0,
                error_message: null,
                link: linkVideo,
                thumbnail_path: pathThumb,
                elementDropType: elementType,
                path: null,
                pathThumb: pathThumb
            })
        }

        if (err) {

            errResult(err)

        } else {

            const fileData = fs.createReadStream(thumbnailFile);
            const env = global.env.trim();

            if (env === dev) {
                try {
                    const fileName = `file-${Date.now()}.png`,
                        pathThumb = path.resolve(__dirname, `../../${uploadVideoPath}/thumbnails/${fileName}`);

                    fileData.pipe(fs.createWriteStream(pathThumb));

                    successResult(`${hostname}${thumbnailPath}/${fileName}`)
                }
                catch (err) {
                    errResult(err)
                }
            } else if (env === pro) {
                uploadFileS3(true, fileData, function(err, s3Path) {
                    if (err) errResult(err)
                    else successResult(s3Path)
                })
            }
        }
    })
}

function uploadFileS3(isThumbnail, file, id, next) {
    if (isThumbnail) {
        var params = {
            Body: file,
            Bucket: bucket,
            Key: `uploads/${id}/thumbnails/` + uuidv4(),
            ACL: "public-read",
            ContentType: 'image/jpg'
        };
        s3.upload(params, function(err, data) {
            const filePath = baseURL + params.Key;
            next(err, filePath);
        });
    } else if (file.headers) {
        var folder;
        if ( file.headers["content-type"].indexOf('video') !== -1 ){
          folder = `uploads/${id}/videos/`;
        }else if ( file.headers["content-type"].indexOf('image') !== -1 ){
          folder = `uploads/${id}/images/`;
        }else{
          folder = `uploads/${id}/`;
        }
        var params = {
            Body: file,
            Bucket: bucket,
            Key: folder + uuidv4(),
            ACL: "public-read",
            ContentLength: file.byteCount,
            ContentType: file.headers["content-type"]
        };
        s3.putObject(params, function(err, data) {
            const filePath = baseURL + params.Key;
            next(err, filePath);
        });
    } else {
        var params = {
            Body: file,
            Bucket: bucket,
            Key: `uploads/${id}/drawings/` + uuidv4(),
            ACL: "public-read",
            ContentType: "image/png",
            ContentEncoding: "base64"
        };
        s3.putObject(params, function(err, data) {
            const filePath = baseURL + params.Key;
            next(err, filePath);
        });
    }
}

function generateThumbnail(file, next) {
    const tempPath = path.resolve(__dirname, `../../${uploadVideoPath}/thumbnails/thumbnail.jpg`);

    var tmpFile = fs.createWriteStream(tempPath);
    var ffmpeg = child_process.spawn("ffmpeg", [
        "-ss", "00:00:01", // time to take screenshot
        "-i", file, // url to stream from
        "-vf", "thumbnail,scale=" + MAX_WIDTH + ":" + MAX_HEIGHT,
        "-qscale:v", "2",
        "-frames:v", "1",
        "-f", "image2",
        "-c:v", "mjpeg",
        "pipe:1"
    ]);
    ffmpeg.on("error", function(err) {
        console.log(err);
    })
    ffmpeg.on("close", function(code) {
        if (code != 0) {
            console.log("child process exited with code " + code);
        } else {
            console.log("Processing finished !");
        }
        tmpFile.end();
        next(code, tempPath);
    });
    tmpFile.on("error", function(err) {
        console.log("stream err: ", err);
    });
    ffmpeg.on("end", function() {
        tmpFile.end();
    })
    ffmpeg.stdout.pipe(tmpFile).on("error", function(err) {
        console.log("error while writing: ", err);
    });
}

var uploadLocal = function (req, res, next) {
    if (!req.body.src) {
        upload(req,res,function(err){
            if(err){
                res.json({error_code: 1, error_message: err});
            }

            const uploadedFile = req.file;
            const elementType = uploadedFile.mimetype.substring(0, uploadedFile.mimetype.lastIndexOf("/"));
            const destination = req.file.destination;

            if(elementType === "image"){
                var filePath = hostname + imagePath + "/" + uploadedFile.filename;
                winston.info(filePath);

                res.json({ error_code: 0,
                    file_path: filePath,
                    elementDropType: elementType
                });
            }else if(elementType === "video"){
                var fileName = uploadedFile.filename.substring(0, uploadedFile.filename.lastIndexOf("."));
                var path_thumbnail = path.resolve(__dirname, '../../' +  uploadVideoPath +"/thumbnails/"+ fileName +".png").replace(new RegExp('\\' + path.sep, 'g'), '/');
                var video_path = path.resolve(__dirname, '../../' +  uploadVideoPath );
                var f_path = path.join(video_path, uploadedFile.filename).replace(new RegExp('\\' + path.sep, 'g'), '/');

                fs.exists(f_path, (exists) => {
                    if(exists){
                        async.waterfall([
                            function(next){
                                thumbler.extract(f_path, path_thumbnail, '00:00:01', '200x200', function(err){
                                    if(err){
                                        console.log("snapshot video can not create", err);
                                        next(err);
                                    }

                                    console.log('snapshot saved to '+path_thumbnail);
                                    next();
                                });
                            }

                        ], function(err){
                            var filePath = hostname + videoPath + "/" + uploadedFile.filename;
                            var thumbPath = hostname + thumbnailPath+ "/" + fileName + ".png";
                            // var thumbPath = path.join(hostname, thumbnailPath, fileName+".png");
                            winston.info(filePath);

                            if(err) {
                                res.json({ error_code: 1,
                                    error_message: err,
                                    file_path: filePath,
                                    thumbnail_path: null,
                                    elementDropType: elementType,
                                    path: f_path,
                                    pathThumb: path_thumbnail
                                });
                            } else {
                                res.json({ error_code: 0,
                                    file_path: filePath,
                                    thumbnail_path: thumbPath,
                                    elementDropType: elementType,
                                    path: f_path,
                                    pathThumb: path_thumbnail
                                });
                            }
                        })
                    }
                });
            }
        });
    }
    else {
        const fileName = `file-${Date.now()}.png`,
            src = req.body.src
        const url = path.resolve(__dirname, '../../' + uploadImagePath + '/' + fileName)
        fs.writeFile(url, src, 'base64', function(err) {
            if (err) {
                res.json({error_code: 1, error_message: err});
            } else {
                res.json({ error_code: 0,
                    file_path: hostname + imagePath + "/" + fileName,
                    elementDropType: 'drawing'
                });
            }
        })
    }
}

var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, next) {
            var elementStrorageType = file.mimetype.substring(0, file.mimetype.lastIndexOf("/"));

            //var subFolder = nconf.get(req.params.location) || '';
            switch(elementStrorageType){
                case "image":
                    next(null, path.resolve(__dirname, '../../' +  uploadImagePath ));
                    break;
                case "video":
                    next(null, path.resolve(__dirname, '../../' +  uploadVideoPath ));
                    break;
                default:
                    break;
            }

        },
        filename: function (req, file, next) {
            const fileInfo = file.originalname.split('.'),
                datetimestamp = Date.now()

            next(null, file.fieldname + '-' + datetimestamp + '.' + fileInfo[fileInfo.length -1])
        }
    });

var upload = multer({storage: storage}).single('file');

module.exports = uploadHelpers;
