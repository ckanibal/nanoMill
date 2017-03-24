import React from 'react';
import ReactDOM from 'react-dom';

// Modules
import FileTreeView from './FileTreeView.jsx'

// Stylesheet
import "./Application.less";

class Application extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
          <FileTreeView root={__dirname} />
        );
    }
}

ReactDOM.render(<Application/>, document.getElementById('container'));
