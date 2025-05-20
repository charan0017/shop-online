import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProductsPage from './routes/ProductsPage';
import ProductPage from './routes/ProductPage';
import LoginPage from './routes/LoginPage';
import CartPage from './routes/CartPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
