import React, {Component} from 'react';
import ReactDOM from "react-dom";
//import ScrollAnimation from 'react-animate-on-scroll';
import './style.css';

export default class Collaborate extends Component {

 /*   constructor(props) {
        super(props);
        this.showDivs = this.showDivs.bind(this);
        this.plusDivs = this.plusDivs.bind(this);
        this.plusDivs1 = this.plusDivs1.bind(this);
        this.carousel = this.carousel.bind(this);
        this.state = {
            display: 'none',
            slideIndex: 1,
            myIndex: 0
        };
    }
*/

  /*  componentDidMount() {
        this.showDivs(this.state.slideIndex);
     //   this.carousel();
    }
*/
 /*   showDivs = (n) => {
        var i;
        var x = document.getElementsByClassName("mySlidesCrsl");
        if (n > x.length) {
            this.setState({
                slideIndex: 1
            }, function() {
                for (i = 0; i < x.length; i++) {
                    x[i].style.display = "none";
                }
                var temp2 = this.state.slideIndex;
                temp2 = temp2 - 1;
                x[temp2].style.display = "inline-block";

            });
        } else if (n < 1) {
            this.setState({
                slideIndex: x.length
            }, function() {
                for (i = 0; i < x.length; i++) {
                    x[i].style.display = "none";
                }
                var temp2 = this.state.slideIndex;
                temp2 = temp2 - 1;
                x[temp2].style.display = "inline-block";
            });
        } else {
            for (i = 0; i < x.length; i++) {
                x[i].style.display = "none";
            }
            var temp2 = this.state.slideIndex;
            temp2 = temp2 - 1;
            x[temp2].style.display = "inline-block";
        }
    }
*/

/*    plusDivs = () => {
        // var n=-1;
        this.setState({
            slideIndex: this.state.slideIndex - 1
        }, function() {
            var temp1 = this.state.slideIndex;
            // temp1+=n;
            this.showDivs(temp1);
        })
    }

*/
/*    plusDivs1 = () => {
        //   var n=1;
        this.setState({
            slideIndex: this.state.slideIndex + 1
        }, function() {
            var temp1 = this.state.slideIndex;
            // temp1+=n;
            this.showDivs(temp1);
        })


    }
*/
 /*   carousel = () => {
        var i;
        var x = document.getElementsByClassName("mySlidesCrsl");

        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        this.setState({
            myIndex: this.state.myIndex + 1
        }, function() {
            if (this.state.myIndex > x.length) {
                this.setState({
                    myIndex: 1
                }, function() {
                    x[this.state.myIndex - 1].style.display = "inline-block";
                    setTimeout(this.carousel, 5000); // Change image every 2 seconds
                })
            } else {
                x[this.state.myIndex - 1].style.display = "inline-block";
                setTimeout(this.carousel, 5000); // Change image every 2 seconds
            }

        })
    }
*/
  render(){

    return(
      <div id="exhibition" className="collaborate_wrapper wrapper">

          {  /*    <img className="arrowLeft" src="/img/login/sliderarrow_left.svg" onClick={this.plusDivs.bind(this)}/>*/}

          <div id="allImages" className="allImagesText1">
             <div className="mySlidesCrsld">
                 <img className="mySlidesImage" id="mySlides1" src="/img/login/exhibition.gif" />
                 <br/>
                 <div className="content">
                   <h2 className="headline">Exhibit your photos & videos </h2>
                   <p>Create the right composition & journey for your content</p>
                 </div>
             </div>
           </div>
            { /* <div className="mySlidesCrsl" style={{display:this.state.display}}>
              <img className="mySlidesImage" id="mySlides2" src="/img/login/martino-pietropoli-618258-unsplash.png"/>
              <br/>
              <h2 className="headline">Create immersive experiences</h2>
              <p>Choose how to present your work</p>
            </div>
            <div className="mySlidesCrsl" style={{display:this.state.display}}>
              <img className="mySlidesImage" id="mySlides3" src="/img/login/samuel-zeller-74983-unsplash.png" />
              <br/>
              <h2 className="headline">Organize content the way it makes sense</h2>
              <p>Choose how to present your work</p>
            </div> */ }
            <div id="allImages2" className="allImagesText2 slide1_mobile">
            <div className="mySlidesCrslm">
                <img className="mySlidesImage" id="mySlides11" src="/img/mobile_images/Exhibit_Photos.gif" width="1152" height="431"/>
                <br/>
                <div className="content">
                  <h2 className="headline">Exhibit your <br/>photos & videos </h2>
                  <p>Create the right composition & journey for your content</p>
                </div>
            </div>
            { /* <div className="mySlidesCrsl" style={{display:this.state.display}}>
              <img className="mySlidesImage" id="mySlides2" src="/img/login/martino-pietropoli-618258-unsplash.png"/>
              <br/>
              <h2 className="headline">Create immersive experiences</h2>
              <p>Choose how to present your work</p>
            </div>
            <div className="mySlidesCrsl" style={{display:this.state.display}}>
              <img className="mySlidesImage" id="mySlides3" src="/img/login/samuel-zeller-74983-unsplash.png" />
              <br/>
              <h2 className="headline">Organize content the way it makes sense</h2>
              <p>Choose how to present your work</p>
            </div> */ }
        </div>
     {/*   <img className="arrowRight" src="/img/login/sliderarrow_right.svg" onClick={this.plusDivs1.bind(this)}/>*/}

     	</div>
    )
  }
}
