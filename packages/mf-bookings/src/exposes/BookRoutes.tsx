import { Routes, Route } from 'react-router-dom';
import Book from '../pages/Book';
import BookByDate from '../pages/BookByDate';
import BookByRoomSelect from '../pages/BookByRoomSelect';
import BookByRoom from '../pages/BookByRoom';

export default function BookRoutes() {
  return (
    <Routes>
      <Route index element={<Book />} />
      <Route path="by-date" element={<BookByDate />} />
      <Route path="by-room" element={<BookByRoomSelect />} />
      <Route path="by-room/:roomId" element={<BookByRoom />} />
    </Routes>
  );
}
