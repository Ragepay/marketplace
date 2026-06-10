import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Card from "../components/card/card";

const baseProduct = {
  _id: "1",
  title: "Mouse Logitech",
  price: 169.99,
  productImage: [{ public_id: "a", secure_url: "http://img/1.jpg" }],
};

const renderCard = (product) =>
  render(
    <MemoryRouter>
      <Card product={product} />
    </MemoryRouter>
  );

describe("Card", () => {
  it("muestra título y precio del producto", () => {
    renderCard(baseProduct);
    expect(screen.getByText("Mouse Logitech")).toBeInTheDocument();
    expect(screen.getByText(/169.99/)).toBeInTheDocument();
  });

  it("muestra el badge 'Vendido' cuando status es sold", () => {
    renderCard({ ...baseProduct, status: "sold" });
    expect(screen.getByText("Vendido")).toBeInTheDocument();
  });

  it("no muestra badge cuando está disponible", () => {
    renderCard({ ...baseProduct, status: "available" });
    expect(screen.queryByText("Vendido")).not.toBeInTheDocument();
  });
});
