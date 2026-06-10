import { useState } from "react";
import "./createproduct.style.css";
import toast from "react-hot-toast";
import Card from "../../components/card/card";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../components/Navbar";

function CreateProduct() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [images, setImages] = useState([]);
  const [imageBlobs, setImageBlobs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleImage = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setImages(files);
    setImageBlobs(files.map((f) => URL.createObjectURL(f)));
  };

  const resetAllFields = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setProvince("");
    setCity("");
    setImages([]);
    setImageBlobs([]);
    setPrice("");
    document.getElementById("myForm").reset();
  };

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(price) <= 0) {
      toast.error("El precio debe ser mayor a 0.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("province", province);
    formData.append("city", city);
    images.forEach((img) => formData.append("productImage", img));

    setIsSubmitting(true);
    try {
      const response = await fetch(import.meta.env.VITE_URL_BACKEND + "/api/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error al crear el producto.");
        return;
      }

      toast.success(data.message || "¡Producto creado exitosamente!");
      resetAllFields();
      setTimeout(() => navigate("/post"), 1500);
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const productPreviewData = {
    productImage: imageBlobs.map((url, i) => ({ public_id: String(i), secure_url: url })),
    title,
    price,
  };

  const CATEGORIES = ["Electrónica", "Hogar", "Indumentaria", "Vehículos", "Juguetes", "Deportes", "Coleccionables", "Otros"];
  const PROVINCES = ["Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"];
  const MAX_DESC = 600;

  return (
    <>
      <NavBar />
      <div className="create-product">
        <div className="title-container">
          <h2 className="form-title">Publicar producto</h2>
          <p className="form-subtitle">
            Completá los datos de tu publicación. La vista previa muestra cómo se verá en el catálogo.
          </p>
        </div>

        <div className="form-container">
          <form id="myForm" onSubmit={handleSubmit}>
            <div className="inputs-container">
              <label htmlFor="title" className="form-field">
                <p>Título</p>
                <input
                  className="input-text"
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Labubu edición especial"
                  maxLength={80}
                  required
                />
              </label>

              <div className="form-row">
                <label className="form-field">
                  <p>Precio (USD)</p>
                  <input
                    className="input-number"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </label>
                <label className="form-field">
                  <p>Categoría</p>
                  <input
                    type="text"
                    className="input-text"
                    list="category-options"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Elegí o escribí una"
                    required
                  />
                  <datalist id="category-options">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </label>
              </div>

              <label className="form-field">
                <p>
                  Descripción
                  <span className="char-count">{description.length}/{MAX_DESC}</span>
                </p>
                <textarea
                  className="input-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Estado, tamaño, edición, detalles..."
                  maxLength={MAX_DESC}
                  required
                />
              </label>

              <div className="form-row">
                <label className="form-field">
                  <p>Provincia</p>
                  <input
                    type="text"
                    className="input-text"
                    list="province-options"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Elegí tu provincia"
                  />
                  <datalist id="province-options">
                    {PROVINCES.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </label>
                <label className="form-field">
                  <p>Ciudad</p>
                  <input
                    type="text"
                    className="input-text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej: Rosario"
                  />
                </label>
              </div>

              <label className="form-field">
                <p>Imágenes (podés seleccionar varias)</p>
                <input
                  className="input-file"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImage}
                  required
                />
                {images.length > 0 && (
                  <span className="file-hint">
                    {images.length} imagen{images.length > 1 ? "es" : ""} seleccionada{images.length > 1 ? "s" : ""}
                  </span>
                )}
              </label>
            </div>

            <div className="buttons-container">
              <Link to="/home/" className="return-link">
                <button type="button" className="return-button">
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || !images.length}
              >
                {isSubmitting ? "Creando..." : "Publicar"}
              </button>
            </div>
          </form>

          <div className="card-preview-container">
            <h3 className="card-preview-title">Vista previa</h3>
            <Card product={productPreviewData} />
            {!imageBlobs.length && (
              <p className="preview-hint">Subí una imagen para ver la vista previa.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateProduct;
