import React from 'react';
import ReactDOM from 'react-dom';
import ExampleComponent from './components/ExampleComponent';

const App = () => {
  return (
    <div>
      <h1>Welcome to the Advance Data Table</h1>
      <ExampleComponent />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));