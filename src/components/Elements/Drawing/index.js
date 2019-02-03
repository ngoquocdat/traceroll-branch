import React from 'react';
import { Image } from 'tr-react-konva';
import Const from '../../Util/const.js';
import Utils from '../../Util/utils.js';

const { PEN_SIZE, PENCIL_SIZE, BRUSH_SIZE } = Const.DRAWING

class TRDrawing extends React.Component {
	
	constructor(props){
		super(props);

        this.state = {
            canvas: null
        }

		this.line = {
			points: [],
        }
        
        localStorage.setItem('tracerollCountDrawed',0)
    }
    
    handleBeforeUnload = (e)=>{
		let currentCountDrawed = localStorage.getItem('tracerollCountDrawed') || 0
		currentCountDrawed = parseInt(currentCountDrawed,10)
		if (currentCountDrawed>0) {
			e.returnValue = "You have unsaved drawing. Are you sure you want to leave ?"
		}
	}
    
    componentDidMount() {
        
        const stage = this.image.getStage(),
            canvas = document.createElement("canvas"),
            context = canvas.getContext("2d"),
            { width, height } = stage.getSize()

        context.lineJoin = "round"
        context.lineCap = "round"

        canvas.width = width
        canvas.height = height

        this.canvas = canvas
        this.ctx = context
        this.mainStage = this.props.getMainStage()

        this.setState({
            canvas: canvas
        })

		stage.on('mouseover', this.handleMouseOver)
        stage.on('mousedown', this.handleStageMouseDown)
        window.addEventListener('mousemove', this.handleWindowMouseMove)
        window.addEventListener('mouseup', this.handleWindowMouseUp)
        window.addEventListener('beforeunload', this.handleBeforeUnload)
	}

	handleStageMouseDown = (e) => {
		
        const button = e.evt.button;
		if (Utils.isLeftClick(button)) {
			
			//If is drawing mode and using eraser tool
			this.isErasing = this.props.options.mode === Const.MODE.ERASER;
		}
	}

	//Handle mouse down event on canvas
	handleMouseDown = (e) => {

		const { button, clientX, clientY } = e.evt

		if (Utils.isLeftClick(button)) {

            const mainStage = this.mainStage,
                scale = mainStage.scaleX(),
                pos = {
                    x: clientX,
                    y: clientY
                },
                start = {
                    x: ~~ (0.5 + (pos.x - mainStage.x()) / scale),
                    y: ~~ (0.5 + (pos.y - mainStage.y()) / scale)
                }

            this.isDrawing = true

            const options = this.props.options
            this.line.mode = options.mode
            this.line.color = options.color

            this.line.points.push(start.x, start.y)
            this.lastPointerPosition = pos

            //clear selectd line
            this.props.addNewLine && this.props.addNewLine({
                mode: Const.MODE.SELECT,
                stage: {
                    points: [],
                    color: 'black'
                }
            })
		}
	}

	handleWindowMouseMove = (e) => {

		const context = this.ctx,
			isDrawing = this.isDrawing,
            isErasing = this.isErasing,
            stage = this.mainStage,
            mode = this.props.options.mode,
            color = this.props.options.color,
            scale = stage.scaleX();
        
        if (isDrawing) {

            const stagePos = stage.position(),
                localPos = {
                    x: e.clientX,
                    y: e.clientY
                },
                startOnCanvas = {
                    x: this.lastPointerPosition.x - this.image.x(),
                    y: this.lastPointerPosition.y - this.image.y()
                },
                endOnCanvas = {
                    x: localPos.x - this.image.x(),
                    y: localPos.y - this.image.y()
                },
                end = {
                    x: ~~ (0.5 + (localPos.x - stagePos.x) / scale),
                    y: ~~ (0.5 + (localPos.y - stagePos.y) / scale)
                }

            let strokeWidth = 1

            if (isErasing) {
                if (true) {
                    const line = this.getLineIntersect(end, this.props.drawings, scale)
                    if (line) {
                        this.handleErasing(line)
                    }
                }
            } else {

                context.strokeStyle = color;

                switch(mode){
                    case Const.MODE.PEN:
                        context.lineWidth = Math.ceil(PEN_SIZE * scale);
                        strokeWidth = PEN_SIZE

                        this.renderLine(startOnCanvas, endOnCanvas);
                        break;
                    case Const.MODE.PENCIL:
                        context.lineWidth = PENCIL_SIZE * scale;
                        strokeWidth = PENCIL_SIZE

                        this.renderLine(startOnCanvas, endOnCanvas);
                        break;
                    case Const.MODE.BRUSH:

                        this.renderBrush(startOnCanvas, endOnCanvas, scale);
                        break;
                    case Const.MODE.SELECT:
                        context.strokeStyle = 'black'
                        context.lineWidth = 1;

                        this.renderLine(startOnCanvas, endOnCanvas);
                        break;
                    default:
                };

                this.line.points.push(end.x, end.y);
                this.line.strokeWidth = strokeWidth;

                this.lastPointerPosition = localPos
            }
		}
	}

	// Drawing Thin & Thick line
	renderLine(start, end) {
		const ctx = this.ctx;
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
		ctx.closePath();
		this.image.getLayer().draw();
	}

	renderBrush(start, end, scale) {
		const ctx = this.ctx;
		ctx.globalAlpha = 0.1;
        ctx.fillStyle = this.line.color;

		const dist = Utils.distanceBetween(start, end),
			angle = Utils.angleBetween(start, end),
			w = BRUSH_SIZE.width * scale,
        	h = BRUSH_SIZE.height * scale,
            sin = Math.sin(angle),
            cos = Math.cos(angle)
        let x, y

		for (let j = 0; j < dist; j += 1) {
			x = start.x + sin * j;
			y = start.y + cos * j;

			ctx.fillRect(x, y, w, h);
		}
		this.image.getLayer().draw();
	}

	handleWindowMouseUp = (e) => {

		//only add new line if real drawing instead of just click
        if (this.isDrawing && this.line.points.length > 2) {
            this.addNewLine();
        }
        this.isDrawing = this.isErasing = false;
        this.line = {
            points: []
        }

        if (e.button === 2 && this.isDrawing) {
            let currentCountDrawed = localStorage.getItem('tracerollCountDrawed') || 0
            currentCountDrawed = parseInt(currentCountDrawed,10)
			localStorage.setItem('tracerollCountDrawed',currentCountDrawed+1)
        }
	}

	addNewLine = () => {
        let currentCountDrawed = localStorage.getItem('tracerollCountDrawed') || 0
            currentCountDrawed = parseInt(currentCountDrawed,10)
			localStorage.setItem('tracerollCountDrawed',currentCountDrawed+1)
		const line = this.line,
			rect = Utils.getSelfRect(this.line.points),
			padding = 16;

		rect.x -= padding;
		rect.y -= padding;

		if (this.props.options.mode === Const.MODE.BRUSH) {
			rect.width += BRUSH_SIZE.width + padding *  2;
			rect.height += BRUSH_SIZE.height + padding *  2;
		} else {
			rect.width += line.strokeWidth + padding *  2;
			rect.height += line.strokeWidth + padding *  2;
		}
		line.rect = rect;

		this.line = {
			points: []
		}

		this.props.addNewLine && this.props.addNewLine(
		{
			mode: this.props.options.mode,
			stage: line
		});
		this.clearLayerDrawing();
	}

	// Clear canvas area
	clearLayerDrawing = () => {
		const context = this.ctx,
			canvas = this.canvas;
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.image.getLayer().draw();
	}

	//Handle mouse over event on stage
	handleMouseOver = (e) => {
		const node = e.target;
		if (node && this.isErasing){
			this.handleErasing(node);
		}
	}

	//Handle erasing event on eraser tool
	handleErasing = (node) =>{

		if (Utils.isLine(node)) {
			const layer = node.getLayer();
			const parent = node.getParent();

			if (parent && parent.hasName(Const.KONVA.NEW_LINES_CONTAINER_NAME)) {
                let currentCountDrawed = localStorage.getItem('tracerollCountDrawed') || 0
                currentCountDrawed = parseInt(currentCountDrawed,10) - 1
				localStorage.setItem('tracerollCountDrawed',currentCountDrawed)
				node.fire(Const.EVENTS.REMOVE);
				node.destroy();
				layer.draw();
			}
		}
	}

	componentWillUnmount(){
        const stage = this.image.getStage();
        
		stage.off('mouseover', this.handleMouseOver);
        stage.off('mousedown', this.handleStageMouseDown);
		window.removeEventListener('mousemove', this.handleWindowMouseMove);
        window.removeEventListener('mouseup', this.handleWindowMouseUp);
        window.removeEventListener('beforeunload',this.handleBeforeUnload)
	}

    getLineIntersect = (pointer, lines, scale) => {

        const offset = 10 / scale
        let line, point1 = {}, point2 = {}, i, n, dist, isInRange

        if (pointer && lines) {
            for (i = 0, n = lines.length; i < n; i++) {
                const shape = lines[i],
                    attrs = shape.attrs,
                    points = attrs.points

                for (let j = 0, k = points.length; j < k - 2; j += 2) {

                    point1.x = points[j]
                    point1.y = points[j + 1]

                    point2.x = points[j + 2]
                    point2.y = points[j + 3]

                    dist = this.distanceToLine(pointer, point1, point2)
                    isInRange = this.isPointInRangeOfLine(pointer, point1, point2)
                    if (isInRange && dist < offset) {
                        line = shape
                        break
                    }
                }

                if (line) {
                    break
                }
            }
        }
        
        return line
    }

    distanceToLine = (point, v, w) => {
        const x0 = point.x,
            y0 = point.y,
            x1 = v.x,
            y1 = v.y,
            x2 = w.x,
            y2 = w.y,
            a = Math.abs((y2-y1)*x0 - (x2-x1)*y0 + x2*y1 - y2*x1),
            b = Math.sqrt((y2-y1)*(y2-y1) + (x2-x1)*(x2-x1))
        return a/b
    }

    isPointInRangeOfLine = (point, v, w) => {
        const x0 = point.x,
            y0 = point.y,
            x1 = v.x,
            y1 = v.y,
            x2 = w.x,
            y2 = w.y,
            dx = x2 - x1,
            dy = y2 - y1,
            innerProduct = (x0 - x1)*dx + (y0 - y1)*dy;
        return 0 <= innerProduct && innerProduct <= dx*dx + dy*dy;
    }

	render() {
		return (
			<Image
                image = {this.state.canvas}
				ref = {node => this.image = node}
				onMouseDown = {this.handleMouseDown}
			/>
		);
	}
}

export default TRDrawing;