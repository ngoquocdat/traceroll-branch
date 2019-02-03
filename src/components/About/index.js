import React, { Component } from 'react';
import Intro from '../Intro/index';
import Footer from '../Footer/index';
import BodyBackground from '../BodyBackground/index';
import './style.css';

export default class About extends Component {

  render() {
    return (
      <BodyBackground background={true} componentTemplate={"about"}>
        <div id="about">
          <Intro />
          <div id="about_wrapper">
            <h1>About Traceroll</h1>
            <p>Traceroll is for everyone. As cliché as it may sound, we truly believe that there’s a creator inside each one of us. The daily scribbles, notes, doodles or photos that we produce each day is just as interesting as a beautifully detailed drawing of a fruit bowl (sometimes more so) - just think about modern art.</p>
            <p>When we began building Traceroll, we were inspired by the exhibition space. The traditional art gallery as we know it, is just a blank box for creatives. Its flexibility allowed artists to create compositions and curate a journey for the visitors to experience. On the other hand, online platforms have enforced parameters and rigid templates, standardizing the interface in which creators could express themselves.</p>
            <p>With Traceroll, we wanted to remove all those templates and rules, by allowing the creators to take over the exhibition space and decide how their work should be displayed.</p>
            <img src="/img/about/fallen_angel-orig.jpg" alt="Jean-Michel Basquiat's Fallen Angel" width="306" height="258"/>
            <p class="caption first">Jean-Michel Basquiat - Untitled (Fallen Angel), 1981</p>
            <p class="caption">“Believe it or not I can actually draw.”</p>
            <h1>Our Story</h1>
            <p>It was the fall of 2015 when we were living together in a dorm at Syracuse University. At the time, we had a long piece of trace paper up, on our living room wall where our friends would freely draw and write whenever they came over to hang out. We filled up this long piece of paper eventually with photos, doodles, doodles on top of those polaroid photos, and intricately drawn art that would take us hours to craft. We were communicating with each other in ways we’ve never felt before.</p>
            <p>The year after, our friends started sending us messages and photos of their own Trace roll that they started pinning up to the wall, to start drawing with all of their friends on the wall. This is when we realized that we needed to turn this idea into a new universal mode of communication.</p>
            <img src="/img/about/syracuse-traceroll.jpg" alt="Traceroll at the Syracuse Apartment" width="100%"/>
            <p class="caption">Our apartment in Syracuse, NY in the winter of 2015</p>
            <h1>What does Traceroll mean?</h1>
            <p>Traceroll is a cheap form of drafting paper that’s used in architecture, design and art. This is the type of paper we used to cover our walls because it was a cheap solution.</p>
            <img src="/img/about/traceroll-paper.jpg" alt="Traceroll in architecture" width="217"/>
            <p class="caption">this is how it looks like</p>
            <h1>and those shapes on the logo?</h1>
            <p>We are big fans of Suprematism. It’s a reaction to the traditional forms of art. Traceroll is also a reaction to the traditional modes of online communication and social media platforms.</p>
            <img className="about-logo" src="/img/logo/logo.svg"  width="75"/>
            <p class="caption-no-center">“the visual phenomena of the objective world are, in themselves, meaningless; the significant thing is feeling, as such, quite apart from the environment in which it is called forth.” - Kazimir Malevich about Suprematism</p>
           <br />
          </div>
          <div className="footer_wrapper wrapper">
            <Footer />
          </div>
        </div>
    </BodyBackground>
    );
  }
}
