import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App.js'
import 'bootstrap/dist/css/bootstrap.css'
require('./stylesheets/main.scss');

ReactDOM.render(<App />, document.querySelector('.app-container'))
