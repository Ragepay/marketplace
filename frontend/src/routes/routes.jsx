import { Route, Routes, Navigate } from "react-router-dom";
import { Home } from "../pages/Home/Home";
import { Detail } from "../pages/Detail/Detail";
import HomeLayout from "../layouts/HomeLayout";
import Error404 from "../pages/Error/Error404";
import { LandingPage } from "../pages/Landing/Landing";
import CreateProduct from "../pages/Product/CreateProduct";
import { Chat } from "../pages/Chat/Chat";
import { Chats } from "../pages/Chat/Chats";
import { Profile } from "../pages/Profile/Profile";
import { Recover } from "../pages/Recover/Recover";
import { Seller } from "../pages/Seller/Seller";
import { Verify } from "../pages/Verify/Verify";
import { AdminReports } from "../pages/Admin/Reports";
import Register from "../pages/Register/Register";
import Cart from "../pages/Cart/Cart";
import { Post } from "../pages/Post/Post";
import EditPost from "../pages/EditPost/EdithPost";

const isAuthenticated = () => !!localStorage.getItem("token");

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const MyRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recover" element={<Recover />} />
      <Route path="/seller/:id" element={<Seller />} />
      <Route path="/verify" element={<Verify />} />

      <Route path="/home" element={<HomeLayout />}>
        <Route index element={<Home />} />
        <Route path=":id" element={<Detail />} />
      </Route>

      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <Chats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:chatId"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product/create"
        element={
          <ProtectedRoute>
            <CreateProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post"
        element={
          <ProtectedRoute>
            <Post />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit/:id"
        element={
          <ProtectedRoute>
            <EditPost />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Error404 />} />
    </Routes>
  );
};

export default MyRoutes;
