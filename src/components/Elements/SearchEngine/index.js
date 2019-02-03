import React, { Component } from 'react';
import './style.css';
import Jquery from 'jquery';
import TrService from '../../Util/service.js';
const _SEARCHID = "search-engine";
const _SEARCHINPUT = "search-input";

class Search extends Component {
	constructor(props) {
			super(props);

			this.state = {
				listUser: [],
				// listUserSlug: [],
				content_search: ''
			}

			this.handleInputSearch = this.handleInputSearch.bind(this);
			this.removeLoader = this.removeLoader.bind(this);
			this.handleSetTimeOut = this.handleSetTimeOut.bind(this);
			this.handleWindowMouseUp = this.handleWindowMouseUp.bind(this);
	}

	componentWillMount(){
		window.addEventListener("mouseup", this.handleWindowMouseUp);
	}

	componentWillUnmount() {
		window.removeEventListener("mouseup", this.handleWindowMouseUp);
	}

    keypressValidate(event) {
        const regex = new RegExp("^[a-zA-Z0-9]+$");
        const key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
        if (!regex.test(key)) {
           event.preventDefault();
           return false;
        }
    }

	handleWindowMouseUp = (e) => {
		if(e.target.id !== _SEARCHINPUT.toString()){
			Jquery('#dropDown-username').addClass("hide");
			Jquery(`#${_SEARCHINPUT}`).val('');
		}
	}

	timeOut = undefined;

	handleInputSearch(){
		let inputSearch = Jquery(`#${_SEARCHINPUT}`).val();
		( document.getElementById(_SEARCHID.toString()) && document.getElementById(_SEARCHINPUT).value.length > 0 ) ? document.getElementById(_SEARCHID.toString()).classList.add('loading') : document.getElementById(_SEARCHID.toString()).classList.remove('loading');
		this.setState({content_search: inputSearch})
		this.handleSetTimeOut(inputSearch);
	}

	removeLoader(){
		( document.getElementById(_SEARCHID.toString()) ) ? document.getElementById(_SEARCHID.toString()).classList.remove('loading') : '';
	}

	handleSetTimeOut(inputSearch) {
		let specialChars = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
		let self = this;

		if (this.timeOut) {
			clearTimeout(this.timeOut);
			this.timeOut = undefined;
		}

		this.timeOut = setTimeout(function(){
			let trim_inputSearch = inputSearch.trim();
			let input_length = trim_inputSearch.toString().length;

			if (input_length === 0) {
				Jquery('#dropDown-username').addClass("hide");
				self.setState({listUser: []});
			} else if (Jquery("#search-input").val().trim().length !== 0) {
				if(specialChars.test(trim_inputSearch) === true){
					return;
				}
				const requestBody = {
					contentSearch: trim_inputSearch
				};
				const callback = function(response){

					let list = response.data.listUsers,
						userNameArr = [];
					//Handle search error and success
					if (response.data.error === 1) {
						userNameArr = userNameArr;

					} else if (response.data.error === 2) {
						userNameArr = [];

						self.setState({listUser: userNameArr}, function(){
							Jquery('#dropDown-username').addClass("hide");
						});

					} else {
						if (Jquery(`#${_SEARCHINPUT}`).val().trim().length !== 0) {
							for(let i = 0; i < list.length; i++){
								let userObj = {
									username:list[i].username,
									userSlug:list[i].userslug,
									picture:list[i].picture,
									fullName:list[i].fullname
								}
								userNameArr.push(userObj);
							};
						} else {
							userNameArr = [];
						}

						self.setState({listUser: userNameArr}, function(){
							Jquery('#dropDown-username').removeClass("hide");
							this.removeLoader();
						});
					}
				}

				TrService.searchUser(requestBody, callback.bind(this))
			}
		}, 150);
	}

	render(){
		const searchInfo = this.state.content_search;
		return(
			<div id="search-engine">
				<input type="image" className="searchbutton" name="search" src="/img/icons/search2.svg" alt="Search" width="18" height="18"></input>
				<input 	id="search-input"
						classame="sfield"
						type="text"
						name="search"
						placeholder="Search people"
						onInput={this.handleInputSearch}
						onBlur={this.removeLoader}
						onMouseLeave={this.removeLoader}
						maxLength="40"
						size="29">
				</input>
				<ul id="dropDown-username" className="hide search-style">
					{this.state.listUser.map((userObj, index)=>{
						const userSlug = userObj.userSlug || "",
							fullName = userObj.fullName || "";
						let representName;

						if(userSlug.length >= searchInfo.length){
							representName = userSlug;
						}else{
							representName = fullName;
						}
						return(
							<li className="search-results">
								<a href={`/stage/${userObj.userSlug}`} onClick={this.props.handleRedirectPage}>
									<img className="search-avatar" src={userObj.picture} />
									<div className="d-inline-block">
										<span>{userObj.userSlug}</span> <br/>
										<span className="text-muted">{fullName}</span>
									</div>
								</a>
							</li>
						)
						//return <li><a href={"/stage/"+userObj.userslug} onClick={this.props.handleRedirectPage}>{representName}</a></li>
					})}
				</ul>
			</div>
		)
	}
}

export default Search;
