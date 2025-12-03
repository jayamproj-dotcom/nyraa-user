import React, { useEffect, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { FeaturedCategoryButton } from '../ui/Buttons';

const ActivewearSpotlight = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch activewear and accessories products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        let allProducts = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = await fetch(`http://localhost:5000/api/products?page=${page}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.statusText}`);
          }
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "API request failed");
          }
          const productArray = data.data?.products || [];
          if (!Array.isArray(productArray)) {
            throw new Error("Could not extract product array from API response");
          }
          allProducts = [...allProducts, ...productArray];
          totalPages = data.data?.pagination?.totalPages || 1;
          page++;
        }

        // Filter for one Activewear and one Accessories product
        const activewearProduct = allProducts
          .filter((item) => {
            const categoryName = typeof item.category === 'object' ? item.category?.category : item.category;
            return categoryName?.toLowerCase() === 'activewear';
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 1); // Take most recent Activewear product

        const accessoriesProduct = allProducts
          .filter((item) => {
            const categoryName = typeof item.category === 'object' ? item.category?.category : item.category;
            return categoryName?.toLowerCase() === 'accessories';
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 1); // Take most recent Accessories product

        // Combine and transform data
        const transformedData = [...activewearProduct, ...accessoriesProduct].map((item) => {
          const variants = Array.isArray(item.variants) ? item.variants : [];
          const firstVariant = variants[0] || {};
          const discountPrice = item.discount > 0 ? `From ₹${firstVariant.price || item.price || 0}` : null;
          const categoryName = typeof item.category === 'object' ? item.category?.category || 'Uncategorized' : item.category || 'Uncategorized';
          const categorySlug = typeof item.category === 'object' ? item.category?.cat_slug || generateSlug(categoryName) : generateSlug(categoryName);
          const titleName = typeof item.name === 'string' ? item.name : 'Unnamed Product';
          return {
            title: categoryName,
            subtitle: titleName,
            imageUrl: item.image || item.images?.[0] || 'https://via.placeholder.com/250',
            discountPrice,
            categorySlug,
          };
        });

        setItems(transformedData);
        setLoading(false);
      } catch (err) {
        console.error("ActivewearSpotlight: Failed to load products:", err.message);
        setError(err.message);
        setItems([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (loading) {
    return (
      <section className="py-3 px-3 mx-3">
        <div className="text-center py-5">
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-3 px-3 mx-3">
        <div className="text-center py-5">
          <h5>Error: {error}</h5>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-3 px-3 mx-3">
        <div className="text-center py-5">
          <h5>No Activewear or Accessories products available</h5>
        </div>
      </section>
    );
  }

  return (
    <section className="py-3 px-3 mx-3">
      <h2 className="text-center mb-5">Activewear & Accessories Spotlight</h2>
      <Row className="g-3">
        {items.map((item, index) => (
          <Col md={6} xs={12} key={index}>
            <div className="d-flex flex-column-reverse flex-md-row bg-white shadow rounded overflow-hidden">
              <div className="p-3 d-flex flex-column justify-content-center text-center" style={{ flex: '1 1 50%' }}>
                <small className="text-uppercase text-muted">{item.title}</small>
                <h3 className="fw-bold">{item.subtitle}</h3>
                {item.discountPrice && <p className="discount-price">{item.discountPrice}</p>}
                <div className="mt-3">
                  <FeaturedCategoryButton
                    link={item.categorySlug}
                    basePath="/collections"
                    label="Discover Now"
                  />
                </div>
              </div>
              <div
                style={{
                  flex: '1 1 50%',
                  backgroundImage: `url(${item.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '250px',
                  width: '100%',
                }}
                onError={(e) => {
                  e.currentTarget.style.backgroundImage = 'url(https://via.placeholder.com/250)';
                }}
              ></div>
            </div>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default ActivewearSpotlight;