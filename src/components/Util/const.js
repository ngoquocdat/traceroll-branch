const Const = {
	ZOOM: {
		min: 0.01,
		max: 6
	},
	SCALE_BY: 0.95,
	CURSOR: {
		pen: 'url(/img/tools/pen-tool.cur), url(/img/tools/pen-tool.png), auto',
		brush: 'url(/img/tools/brush-tool.cur), url(/img/tools/brush-tool.png), auto',
		pencil: 'url(/img/tools/pencil-tool.cur), url(/img/tools/pencil-tool.png), auto',
		eraser: 'url(/img/tools/eraser-tool.cur) 0 15, url(/img/tools/eraser-tool.png) 0 15, auto',
		select: 'url(/img/tools/choosen.cur) 10 15, url(/img/tools/choosen.png) 10 15, auto',
		'eraser-on': 'url(/img/tools/eraser-on.cur) 0 15, url(/img/tools/eraser-on.png) 0 15, auto',
		'select-on': 'pointer',
		default: 'default'
	},
	MODE: {
		PEN: 'pen',
		BRUSH: 'brush',
		PENCIL: 'pencil',
		ERASER: 'eraser',
		SELECT: 'select'
	},
	SHAPE_TYPE: {
		TEXT: 'text',
		IMAGE: 'image',
		VIDEO: 'video',
		PEN: 'drawing:pen',
		PENCIL: 'drawing:pencil',
		BRUSH: 'drawing:brush',
		GROUP: 'drawing:group'
	},
	KONVA: {
		NEW_LINES_CONTAINER_NAME: 'groupNewLine',
		TIME_LINE_NODE: 'timeLine',
		PROFILE_IMAGE: 'profileImage',
		TRANSFORM: 'transform'
	},
	GROUP_NAME_LINES_SELECTED: "group_name_lines_selected",
	EVENTS: {
		REMOVE: 'remove',
		SHOW_ALERT_PROFILE_IMAGE: 'showalert',
		SHOW_TRANSFORM: 'showtransform',
		HIDE_TRANSFORM: 'hidetransform',
		STAGE_WHEEL: 'stagewheel'
	},
	FONT_SIZE_RATIO: 11,
	PADDING_CAPTION: 5,
	MOUSE_DIRECTION: {
		Left: 0,
		Right: 1,
		Up: 2,
		Down: 3
	},
	PROFILE_IMAGE_SIZE: 163,
	PROFILE_IMAGE_SIZE_SMALL: 50,
	IMAGE_HEIGHT: 200,
	ToastType: {
		NO_PER: 0,
		SAVING: 1
	},
	MENU_HEIGHT: 80,
	INVALID_PASSWORD_MSG: 'Password should at least have 6 characters',
	PASSWORD_REGEXP: '[a-zA-Z0-9]{6,}', // Old regexp /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\d\W\w]{6,}/gm
	EMAIL_ERROR: 'Please enter a valid email address',
    DRAWING: {
        PEN_SIZE: 4,
        PENCIL_SIZE: 2,
        BRUSH_SIZE: {
            width: 10,
            height: 20
        },
	},
	DEFAULT_MAX_IMAGE_SIZE: 10485760, //bytes - 10MB
	DEFAULT_MAX_IMAGE_WIDTH: 10000, // pixels
	DEFAULT_MAX_IMAGE_HEIGHT: 10000, // pixels
	DEFAULT_MAX_VIDEO_SIZE: 62914560, //bytes - 75MB
	DEFAULT_MAX_VIDEO_DURATION: 60 //seconds
}
export default Const
