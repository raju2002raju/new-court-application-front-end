import './App.css';
import Home from './Components/Home/Home';
import LoginPage from './Components/LoginPage/LoginPage'
import {BrowserRouter, Routes ,Route} from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage/>} />
        <Route path='/home' element={<Home/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
