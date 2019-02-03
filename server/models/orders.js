'use strict';

var async = require('async'),
		util = require('util'),
		nconf = require('nconf'),
		moment = require('moment'),
		helpers = require('./helpers'),
		users = require('./users'),
		winston = require('winston'),
		meta = require('./../meta'),
		_ = require('underscore'),
		Categories = require('./categories'),
		Tours = require('./tours'),
		db = require('../database/mongo.js');

 
(function(Orders){
		require('./orders/create')(Orders);
		require('./orders/update')(Orders);

	Orders.getCountOrders = function(callback){
		db.sortedSetCard('orders:createdDate', function (err, countOrders) {
				if(err){
					callback(null,0);
				}else{
					
					callback(null,countOrders);
				}
		});
	}//End getCountOrders

	Orders.getScreenOrders = function (callback) {

		var listOrderKey = [];
		var listOrderCustomerKey = [];
		var listOrderTourKey = [];
		var listOrderMembers = [];
        var keyOrderCreate = "orders:createdDate";
        var start = 0;
	    var orders ; 
        db.getObjectValue(keyOrderCreate, function(err, orderIds){
            if (err){
                return callback(err,[]);
            }
           	else
		    {	
			    //sort tour
			    db.getSortedSetRevRangeWithScores(keyOrderCreate,start,orderIds.length,function (err,listOrderId) {
			     	async.each(listOrderId, function (item, callback) {
			     		var keyOrder = 'order:'+item.value;
				      	listOrderKey.push(keyOrder);

				      	var orderCustomer = 'order:'+item.value+':customer';
				      	listOrderCustomerKey.push(orderCustomer);

				      	var orderTour = 'order:'+item.value+':tour';
				      	listOrderTourKey.push(orderTour);

				      	var orderMember = 'order:'+item.value+':members';
				      	listOrderMembers.push(orderMember);
				      	callback();
				     },
			     	function (err) {
				      	if (err) {
				       		console.log("Error happened");
				      	}
				     	else {
				     		var listContactKey = [];
				     		var listTourKey = [];
				       		async.parallel({
	                            
	                            orders: function (next) {
	                              	db.getObjects(listOrderKey,next);
	                            },
	                            
	                            customer:function (next) {
	                            	 db.getObjects(listOrderCustomerKey,function(err,contactIds){
	                            	 	async.each(contactIds, function (item, callback) {
								     		var keyContact = 'contact:'+item.value;
									      	listContactKey.push(keyContact);

									      	callback();
									     },
								     	function (err) {
									      	if (err) {
									       		console.log("Error happened");
									      	}
									     	else {
									     		 db.getObjects(listContactKey,next);
									     	}})
		                            	 })
	                            },

	                            tour:function (next) {
	                            	db.getObjects(listOrderTourKey,function(err,tourIds){
	                            		
	                            			async.each(tourIds, function (item, callback) {
	                            				if(item == undefined)
	                            				{	
	                            					listTourKey.push('');
	                            					callback();
	                            				}
	                            				else{
	                            					var keyTour = 'tour:'+item.value;
										      		listTourKey.push(keyTour);
										      		callback();
	                            				}
									     		
											},
										    function (err) {
										      	if (err) {
										       		console.log("Error happened");
										      	}
										     	else {
										     		
										     		db.getObjects(listTourKey,next);
											}})
	                            		
		                            })
	                            },
	                            countMember: function(next){
	                            	countMemberOfOrder(listOrderMembers,next);
		                            		
	                            },
	                            isCheckItemRetails: function(next){
	                            	isCheckOrderRetails(listOrderId,next);
	                            }        
                        	},

	                        function (err, results) {
	                            
	                            if (err){
	                                return callback(err);
	                            }
	                           
	                            orders = results.orders;
	                            for (var i=0; i < orders.length; i++){
	                                if (orders[i])
	                                { 
	                                    orders[i].nameCustomer = results.customer[i].name;
	                                    orders[i].phoneCustomer = results.customer[i].phone;
	                                    orders[i].emailCustomer = results.customer[i].email;
	                                    orders[i].members = results.countMember['order:'+orders[i].id+':members'];
	                                    orders[i].isCheckRetails = results.isCheckItemRetails['order:'+ orders[i].id];
	                                    var startDate = moment(orders[i]['start_date'] + "23:59:59", 'DD/MM/YYYY HH:mm:SS').valueOf();
	                                    console.log(startDate);
	                                    orders[i].start_date_number = startDate;
	                                    if(results.tour[i] != undefined){
	                                    	orders[i].tourName = results.tour[i].name; 
	                                    	orders[i].tourId = results.tour[i].id; 
	                                    }
	                                    else{
	                                    	orders[i].tourName = '';
	                                    }
	                                    
	                                     
	                                }
	                            }

	                            callback(null, orders);
	                     	}); 

				       	 
				      	}
			     	}
			    )});
			}
	    });
	}//End getScreenOrders

	Orders.getOrder = function(orderId,callback){
		db.getObject('order:'+orderId,function(err,order){
			if(err)
			{
				callback(err);
			}else{
				callback(null,order);
			}
		})
	}//End getOrder

	function isCheckOrderRetails(orderIds,callback){
		var key = 'order:retails';
		var listCheckRetails = [];
		 db.getObjectValue(key,function(err,listOrderId){
    	 	async.each(orderIds, function (orderId, callback) {
	     		helpers.isCheckItemArray(listOrderId,orderId.value,function(err,isCheckItem){
	     			if(isCheckItem == true)
	     			{
	     				listCheckRetails['order:'+orderId.value] = true;
	     			}else{
	     				listCheckRetails['order:'+orderId.value] = false;
	     			}
	     			
	     		})

		      	callback();
		     },
	     	function (err) {
		      	if (err) {
		       		console.log("Error happened");
		      	}
		     	else {
		     		 callback(null,listCheckRetails);
		     	}})
        })
	}


	function countMemberOfOrder (keys,callback){
			var listCount = [];
			
			async.each(keys, function (item, callback) {
								     	
				db.sortedSetCard(item,function(err,countMember){
					listCount[item] = (countMember);
					callback();
				})
		      	
		     },
	     	function (err) {
		      	if (err) {
		       		console.log("Error happened");
		      	}
		     	else {
		     		callback(null,listCount);
		 		}
		 	})
	}

	Orders.getOrder = function(orderId, callback){
		if (!orderId){
			return callback();
		}

		Orders.getOrders([orderId], function (err, orders) {
			callback(err, orders[0]);
		});
	}

	Orders.getOrders = function (orderIds, callback) {

		if (Array.isArray(orderIds) && orderIds.length>0){
			getOrdersData(orderIds, callback);
		}else{
			//Get all
			db.getSortedSetRevRange('orders:createdDate', 0, -1, function (err, orderIds) {
				getOrdersData(orderIds, callback);
			});
		}
		
		
	}
	function getToursInfor(orderIds, callback) {
		var keys = helpers.buildKeys('order',orderIds,'tour');
		db.getSortedSetsMembers(keys, function (err, tourIds) {
			Tours.getSimpleToursData(tourIds, callback);
		});
		
	}

	function getOrdersData(orderIds, callback){
		if (!orderIds){
			return callback(null, []);
		}
		var orderKeys = helpers.buildKeys('order', orderIds);

			async.parallel({
				ordersData: 	async.apply(db.getObjects, orderKeys),
				customers: 		async.apply(Orders.getContacts, orderIds),
				tours: 		async.apply(getToursInfor, orderIds),
				orderTypes: 	async.apply(getOrderTypes)
			}, function (err, results) {
				for (var i=0; i< results.ordersData.length; i++){
					
					var dateCreated;
					if (results.ordersData[i]){
						dateCreated = results.ordersData[i]['date_created'];
						dateCreated = moment(new Date(dateCreated));
						var start_date = results.ordersData[i]['start_date'] || results.tours[i].start_date;
						var startDate = moment(start_date + "23:59:59", 'DD/MM/YYYY HH:mm:SS').valueOf();
						results.ordersData[i]['date_created_number'] = results.ordersData[i]['date_created'];
						results.ordersData[i]['date_created'] = dateCreated.format('DD/MM/YYYY');
						results.ordersData[i]['start_date_number'] = startDate;
						results.ordersData[i]['customer'] = results.customers[i];
						results.ordersData[i]['type'] = results.orderTypes[results.ordersData[i]['id']];
						results.ordersData[i]['tour'] = results.tours[i];
					}
					
				}
				callback(err, results.ordersData);
			});
	}

	Orders.getContacts = function (orderIds, callback) {
		var keys = helpers.buildKeys('order', orderIds, 'contact');
		db.getSortedSetsMembers(keys, function (err, contactIds) {
			contactIds = _.flatten(contactIds);
			db.getObjects(helpers.buildKeys('contact', contactIds), callback);
		});
	}

	var getOrderTypes = function(callback){
		async.parallel({
			retails: function (next) {
				db.getSortedSetRange('order:retails', 0, -1, function (err, orderIds) {
					var descArray = [];
					async.each(orderIds, function (item, nextLoop) {

						descArray.push('retails');
						nextLoop();
					}, function (err) {
						next(err, _.object(orderIds, descArray));
					});
					
				});
			},
			wholesales: function (next) {
				db.getSortedSetRange('order:wholesales', 0, -1, function (err, orderIds) {
					var descArray = [];
					async.each(orderIds, function (item, nextLoop) {
						descArray.push('wholesales');
						nextLoop();
					}, function (err) {
						next(err, _.object(orderIds, descArray));
					});
				});
			},
			newRequest: function (next) {
				db.getSortedSetRange('order:newrequest', 0, -1, function (err, orderIds) {
					var descArray = [];
					async.each(orderIds, function (item, nextLoop) {
						descArray.push('newrequest');
						nextLoop();
					}, function (err) {
						next(err, _.object(orderIds, descArray));
					});
				});
			}
			
		}, function (err, results) {
			var mergedObj = _.extend(results.retails, results.wholesales, results.newRequest);
			callback(err, mergedObj);
		});
	}
		
})(exports);