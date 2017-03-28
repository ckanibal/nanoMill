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
          <div className="Application">
            <FileTreeView root={__dirname} />
            <div className="center">Content</div>
          </div>
        );
    }
}

ReactDOM.render(<Application/>, document.getElementById('container'));
