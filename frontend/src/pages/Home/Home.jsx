import { useEffect, useRef, useState } from "react";
import NavBar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Cards from "../../components/cards/cards";
import { FiSearch, FiX } from "react-icons/fi";
import "./home.styles.css";

const PAGE_SIZE = 12;
const PAGES_PER_BLOCK = 5; // 5 x 12 = 60 productos por bloque
const CATEGORIES = [
  "Electrónica",
  "Hogar",
  "Indumentaria",
  "Vehículos",
  "Juguetes",
  "Deportes",
  "Coleccionables",
  "Otros",
];

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState("recent");
  const [block, setBlock] = useState(0); // bloque de 60 (0-indexado)
  const [page, setPage] = useState(1); // página de la API (1-indexada)
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  const filteredProducts = products;
  const blockStartPage = block * PAGES_PER_BLOCK + 1;
  const totalBlocks = Math.ceil(totalPages / PAGES_PER_BLOCK);
  // ¿Quedan páginas por cargar dentro del bloque actual (máx 60)?
  const canScrollMore = page < totalPages && page < blockStartPage + PAGES_PER_BLOCK - 1;

  // Fetch con filtros/orden aplicados en el servidor sobre TODO el catálogo
  useEffect(() => {
    const params = new URLSearchParams({
      limit: PAGE_SIZE,
      page,
      sort: order,
    });
    if (searchQuery) params.set("query", searchQuery);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (category) params.set("category", category);
    if (province) params.set("province", province);

    setLoading(true);
    fetch(`${import.meta.env.VITE_URL_BACKEND}/api/products?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          // El inicio de un bloque reemplaza; el resto se va sumando al scrollear
          setProducts((prev) =>
            page === blockStartPage ? data.payload : [...prev, ...data.payload]
          );
          setTotalPages(data.totalPages);
        } else {
          console.error("Error fetching products:", data.error);
        }
      })
      .catch((error) => console.error("Error fetching products:", error))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, order, minPrice, maxPrice, category, province]);

  // Scroll infinito hasta completar el bloque (60 productos)
  useEffect(() => {
    if (!canScrollMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canScrollMore, loading]);

  const resetToStart = () => {
    setBlock(0);
    setPage(1);
  };

  const goToBlock = (newBlock) => {
    setBlock(newBlock);
    setPage(newBlock * PAGES_PER_BLOCK + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    resetToStart();
    setSearchQuery(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setCategory("");
    setProvince("");
    setOrder("recent");
    resetToStart();
  };

  const hasFilters =
    searchQuery || minPrice || maxPrice || category || province || order !== "recent";

  return (
    <>
      <NavBar />
      <div className="home-container">
        {/* Hero */}
        <section className="home-hero">
          <div className="home-hero-content">
            <h1>
              Comprá y vendé <span>lo que quieras</span>
            </h1>
            <p>
              PopMart es el marketplace de la comunidad: publicá lo que quieras
              vender y quien le interese se contacta con vos. Encontrá productos,
              chateá con el vendedor y cerrá el trato.
            </p>
            <div className="home-hero-features">
              <span className="hero-feature">📦 Publicá</span>
              <span className="hero-feature">💬 Chateá</span>
              <span className="hero-feature">🤝 Cerrá el trato</span>
            </div>
          </div>
        </section>

        {/* Filtros + buscador */}
        <div className="filter-container">
          <form className="filter-search" onSubmit={handleSearch}>
            <FiSearch className="filter-search-icon" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="¿Qué estás buscando?"
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="filter-row">
            <label className="filter-field">
              <span>Precio mín.</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); resetToStart(); }}
                placeholder="$0"
                min="0"
              />
            </label>
            <label className="filter-field">
              <span>Precio máx.</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); resetToStart(); }}
                placeholder="Sin límite"
                min="0"
              />
            </label>
            <label className="filter-field">
              <span>Categoría</span>
              <input
                type="text"
                list="filter-category-options"
                value={category}
                onChange={(e) => { setCategory(e.target.value); resetToStart(); }}
                placeholder="Todas"
              />
              <datalist id="filter-category-options">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="filter-field">
              <span>Provincia</span>
              <input
                type="text"
                value={province}
                onChange={(e) => { setProvince(e.target.value); resetToStart(); }}
                placeholder="Todas"
              />
            </label>
            <label className="filter-field">
              <span>Ordenar por</span>
              <select value={order} onChange={(e) => { setOrder(e.target.value); resetToStart(); }}>
                <option value="recent">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="title">Nombre (A-Z)</option>
              </select>
            </label>
            {hasFilters && (
              <button className="filter-clear" onClick={clearFilters} type="button">
                <FiX /> Limpiar
              </button>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 && !loading ? (
          <p className="home-empty">No se encontraron productos.</p>
        ) : (
          <Cards allProducts={filteredProducts} />
        )}

        {/* Sentinela del scroll infinito (dentro del bloque) */}
        {canScrollMore && <div ref={sentinelRef} className="scroll-sentinel" />}

        {loading && <p className="home-loading">Cargando productos...</p>}

        {/* Paginación por bloques de 60 */}
        {!canScrollMore && totalBlocks > 1 && (
          <div className="pagination">
            <button
              className="pagination-button"
              onClick={() => goToBlock(block - 1)}
              disabled={block === 0}
            >
              Anterior
            </button>
            <span className="pagination-info">
              Página {block + 1} de {totalBlocks}
            </span>
            <button
              className="pagination-button"
              onClick={() => goToBlock(block + 1)}
              disabled={block >= totalBlocks - 1}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};
