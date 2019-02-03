import React, {Component} from 'react';

class HandleRegister{

	handleFullName(e){
		this.setState({fullname:e.target.value})
		const _Name=e.target.value;
		const _ErrorClass = 'hasDanger-border';
		const _NoError = '';
		const _NameError = 'Please enter a valid name (no special characters)';
		var specialCheck = new RegExp('([0-9,.!@#$%^&*()])', 'g');
		if(specialCheck.test(_Name)){
			this.setState({
				fullNameClass:_ErrorClass,
				fullNameError:_NameError,
				fullNameCheck:false,
				formError: 'error'
			})
		}
		else{
			this.setState({
					fullNameClass:_NoError,
					fullNameError:_NoError,
					fullNameCheck:true
			})
		}
	}

}

const handleregister = new HandleRegister();
export default handleregister;
