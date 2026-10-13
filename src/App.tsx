import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Host from './pages/Host';
import Board from './pages/Board';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/edit/:gameId" element={<Editor />} />
      <Route path="/host/:gameId" element={<Host />} />
      <Route path="/board/:gameId" element={<Board />} />
    </Routes>
  );
}
