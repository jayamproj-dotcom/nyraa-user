import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import { addToCart } from "../../store/cartSlice";
import { addItemToCart } from "../../store/cartSlice";
import { setBuyProduct, openBuyNow } from "../../store/buyProductSlice"
import { addToWishlist, removeFromWishlist } from "../../store/wishlistSlice";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Spinner } from "react-bootstrap";
import YouMayAlsoLike from "./YouMayAlsoLike/YouMayAlsoLike";
import Newsletter from "../../components/Newsletter/Newsletter";
import BannerBreadcrumb from "../../components/ui/BannerBreadcrumb";
import { AddToCartButton, PurchaseNowTwoButton } from "../../components/ui/Buttons";
import IconLink from "../../components/ui/Icons";
import "./ProductDetail.css";

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items) || [];
  const wishlistItems = useSelector((state) => state.wishlist.items) || [];
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [viewersCount] = useState(Math.floor(Math.random() * 50) + 10);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("specifications");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mainImageRef = useRef(null);
  const thumbnailsContainerRef = useRef(null);
  const zoomLensRef = useRef(null);
  const zoomWindowRef = useRef(null);
  const lensSize = 120;
  const zoomFactor = 2.5;
  const [filteredColors, setFilteredColors] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const BASE_URL = "http://localhost:5000"; // adjust for production


        const response = await fetch(`${BASE_URL}/api/products/${slug}`);
        if (!response.ok) throw new Error(`Failed to fetch product: ${response.statusText}`);

        const data = await response.json();
        if (!data.success || !data.data) throw new Error(data.error || "API request failed");

        const item = data.data;
        const variants = Array.isArray(item.variants) ? item.variants : [];
        const firstVariant = variants[0] || {};
        const specifications = Array.isArray(item.specifications) && item.specifications.length > 0
          ? item.specifications[0]
          : {};

        // Normalize variant images
        const normalizedVariants = variants.map((variant) => ({
          ...variant,
          images: Array.isArray(variant.images)
            ? variant.images.map((img) => (img.startsWith("http") ? img : `${BASE_URL}/uploads/variants/${img}`))
            : [],
        }));

        const transformedProduct = {
          id: item.id?.toString() || item.slug,
          slug: item.slug || generateSlug(item.name),
          name: item.name || "Unnamed Product",

          price: firstVariant.price || item.price || 0,
          originalPrice: firstVariant.originalPrice || item.originalPrice || firstVariant.price || 0,
          discount: item.discount || 0,

          category: typeof item.category === "string"
            ? item.category
            : typeof item.categoryName === "string"
              ? item.categoryName
              : "Uncategorized",
          categorySlug: item.cat_slug || generateSlug(item.categoryName || item.category || "uncategorized"),

          size: normalizedVariants.map(v => v.size).filter(Boolean).join(", ") || "N/A",
          // style: item.style || specifications.Detail || "N/A",
          material: item.material || "N/A",
          brand: item.brand || "N/A",
          color: normalizedVariants.map(v => v.color).filter(Boolean).join(", ") || "N/A",

          images: item.images && Array.isArray(item.images)
            ? item.images
            : [item.image || "/placeholder.svg"],
          highResImages: item.highResImages && Array.isArray(item.highResImages)
            ? item.highResImages
            : item.images || [item.image || "/placeholder.svg"],
          image: item.image || (item.images && item.images[0]) || "/placeholder.svg",

          availability: item.availability || "In Stock",
          description: item.description || "No description available",
          // about: item.seoDescription || "No additional information available",
          about: item.description || "No additional information available",
          rating: parseFloat(item.rating) || 0,
          specifications,
          variants: normalizedVariants, // ✅ variants with full image URLs
        };

        setProduct(transformedProduct);

        const defaultSize = transformedProduct.size.split(", ")[0];
        const defaultColor = transformedProduct.color.split(", ")[0];

        setSelectedSize(defaultSize);
        setSelectedColor(defaultColor);
        setFilteredColors(getColorsForSelectedSize(defaultSize, transformedProduct.variants));

        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setProduct(null);
        setLoading(false);
        toast.error(`Failed to load product: ${err.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);


  useEffect(() => {
    if (thumbnailsContainerRef.current) {
      const activeThumb = thumbnailsContainerRef.current.querySelector(".thumbnail-item.active");
      if (activeThumb) {
        const containerHeight = thumbnailsContainerRef.current.clientHeight;
        const thumbHeight = activeThumb.clientHeight;
        const thumbTop = activeThumb.offsetTop;
        const scrollPosition = thumbTop - containerHeight / 2 + thumbHeight / 2;

        thumbnailsContainerRef.current.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [activeImageIndex]);

  useEffect(() => {
    if (!product) return;

    const defaultSize = product.size.split(", ")[0];
    const defaultColor = product.color.split(", ")[0];

    setSelectedSize(defaultSize);
    setSelectedColor(defaultColor);

    updateSelectedVariant(defaultSize, defaultColor); // ⭐ MUST CALL HERE
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedVariant]);


  console.log({
    naturalWidth: mainImageRef.current?.naturalWidth,
    naturalHeight: mainImageRef.current?.naturalHeight
  });



  const getColorsForSelectedSize = (size, variants) => {
    if (!size || !Array.isArray(variants)) return [];

    const colors = variants
      .filter(v => v.size === size)
      .map(v => v.color);

    return [...new Set(colors)];
  };

  // const updateSelectedVariant = (size, color) => {
  
  //   if (!product || !product.variants) return;

  //   const variant = product.variants.find(
  //     (v) => v.size === size && v.color === color
  //   );

  //   setSelectedVariant(variant || null);
  // };

  // const handleAddToCart = () => {
  //   dispatch(addToCart({ ...product, quantity, color: selectedColor, size: selectedSize }));
  //   toast.success("Item added to cart successfully", {
  //     position: "top-right",
  //     autoClose: 3000,
  //     hideProgressBar: false,
  //     closeOnClick: true,
  //     pauseOnHover: true,
  //     draggable: true,
  //   });
  // };
  
  const updateSelectedVariant = (size, color) => {
    if (!product || !product.variants) return;
    const variant = product.variants.find(v => v.size === size && v.color === color);
    setSelectedVariant(variant || null);
    setActiveImageIndex(0); // always start zoom from first image
  };

  const handleAddToCart = () => {

    // Prepare payload to send to backend
    const addCartItem = {
      productId: product.id,      // Product ID from your product object
      quantity: quantity,          // Quantity selected
      size: selectedSize,          // Selected size
      color: selectedColor,        // Selected color
      price: selectedVariant.price,        // Optional: pass price
    };

    // Dispatch the async thunk to add item to backend cart
    dispatch(addItemToCart(addCartItem))
      .unwrap() // allows error handling
      .then(() => {
        toast.success("Item added to cart successfully", {
          position: "top-right",
          autoClose: 3000,
        });
      })
      .catch((err) => {
        toast.error("Failed to add item to cart: " + err.message, {
          position: "top-right",
          autoClose: 3000,
        });
      });
  };

  const handleBuyNow = () => {

    console.log("selectedVariant :" + selectedVariant);
    
    if (!selectedVariant) {
      toast.error("Please select a color and size");
      return;
    }

    // dispatch(
    //   addToCart({
    //     ...product,
    //     price: Number(selectedVariant.price), // Keep price as number
    //     quantity,
    //     color: selectedColor,
    //     size: selectedSize,
    //   })
    // );

    dispatch(
      setBuyProduct({
        ...product,
        price: Number(selectedVariant.price), // Keep price as number
        quantity,
        color: selectedColor,
        size: selectedSize,
      })
    );

    dispatch(openBuyNow());

    toast.success("Item added to cart successfully", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    navigate("/checkout");
  };


  const handleThumbnailClick = (index) => {
    setActiveImageIndex(index);
  };

 // Add this state for image dimensions
const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

// Add this effect to track image dimensions
useEffect(() => {
  if (mainImageRef.current && selectedVariant?.images?.[activeImageIndex]) {
    const img = new Image();
    img.src = selectedVariant.images[activeImageIndex];
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
  }
}, [selectedVariant, activeImageIndex]);

// Replace the handleMouseMove function with this improved version
const handleMouseMove = (e) => {
  if (!mainImageRef.current || !zoomLensRef.current || !zoomWindowRef.current) return;
  
  const img = mainImageRef.current;
  const rect = img.getBoundingClientRect();
  const imageUrl = selectedVariant?.images?.[activeImageIndex] || product.image;

  // Calculate cursor position relative to image
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Calculate boundaries for lens
  const lensHalf = lensSize / 2;
  
  // Make sure lens stays within image bounds
  const boundedX = Math.max(lensHalf, Math.min(x, rect.width - lensHalf));
  const boundedY = Math.max(lensHalf, Math.min(y, rect.height - lensHalf));

  // Position the lens
  zoomLensRef.current.style.left = `${boundedX - lensHalf}px`;
  zoomLensRef.current.style.top = `${boundedY - lensHalf}px`;

  // Calculate zoom window dimensions
  const displayedWidth = img.offsetWidth;
  const displayedHeight = img.offsetHeight;
  
  // Get the natural image dimensions
  const naturalWidth = imageDimensions.width || img.naturalWidth;
  const naturalHeight = imageDimensions.height || img.naturalHeight;

  // Calculate zoom ratios
  const zoomWidth = naturalWidth / displayedWidth;
  const zoomHeight = naturalHeight / displayedHeight;

  // Calculate background position for zoom window
  const bgX = ((boundedX / displayedWidth) * naturalWidth * zoomFactor);
  const bgY = ((boundedY / displayedHeight) * naturalHeight * zoomFactor);

  // Apply zoom to window
  zoomWindowRef.current.style.backgroundImage = `url(${imageUrl})`;
  zoomWindowRef.current.style.backgroundSize = `${naturalWidth * zoomFactor}px ${naturalHeight * zoomFactor}px`;
  zoomWindowRef.current.style.backgroundPosition = `-${bgX - (lensSize * zoomFactor / 2)}px -${bgY - (lensSize * zoomFactor / 2)}px`;
};

  const handleThumbnailHover = (index) => {
    setActiveImageIndex(index);
  };
  const handleColorChange = (color) => {
    setSelectedColor(color);
    updateSelectedVariant(selectedSize, color);
  };


  const handleSizeChange = (size) => {
    setSelectedSize(size);

    // Filter colors for this size
    const colors = getColorsForSelectedSize(size, product.variants);
    setFilteredColors(colors);

    // Auto pick first color
    const newColor = colors[0] || "";
    setSelectedColor(newColor);
    // Update variant for price
    updateSelectedVariant(size, newColor);
  };



  const handleQuantityChange = (newQuantity) => {
    setQuantity(Math.max(1, newQuantity));
  };

  const handleWishlistToggle = () => {
    const isInWishlist = wishlistItems.some(
      (item) => Number(item.productId) === Number(product.id)
    );
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist({ product, variantIndex: 0 }));
    }
  };

  const handleThumbnailMouseEnter = (index) => {
    setHoverIndex(index);
    handleThumbnailHover(index);
  };

  const handleThumbnailMouseLeave = () => {
    setHoverIndex(null);
  };

  const renderSpecificationValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return value;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-5">
        <h3>{error || "Product not found"}</h3>
        <Button variant="primary" onClick={() => navigate("/home")}>
          Back to Home
        </Button>
      </div>
    );
  }

  const capitalizeCategory = (category) => {
    if (typeof category !== 'string') return "Uncategorized";
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <>
      <BannerBreadcrumb
        breadcrumbs={[
          { label: "Home", link: "/home" },
          {
            label: capitalizeCategory(product.category),
            link: `/collections/${product.categorySlug}`,
          },
          { label: product.name },
        ]}
        title={product.name}
        backgroundImage="https://images.unsplash.com/photo-1445205170230-053b83016050"
      />
      <div className="product-detail">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="product-images-container">
                <div className="thumbnails-container d-none d-md-flex" ref={thumbnailsContainerRef}>
                  {selectedVariant?.images?.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail-item ${activeImageIndex === index ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(index)}
                      onMouseEnter={() => setActiveImageIndex(index)}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="thumbnail-image"
                        onError={(e) => (e.target.src = "/placeholder.svg")}
                      />
                    </div>
                  ))}
                </div>

                <div
                  className="main-image-container"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                >
                  <img
                    ref={mainImageRef}
                    src={selectedVariant?.images?.[activeImageIndex] || product.image || "/placeholder.svg"}
                    className="img-fluid product-images"
                    alt={product.name}
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                    onLoad={(e) => {
                      setImageDimensions({
                        width: e.target.naturalWidth,
                        height: e.target.naturalHeight
                      });
                    }}
                  />

                  {isZoomed && (
                    <>
                      <div className="zoom-lens" ref={zoomLensRef}></div>
                      <div className="zoom-window" ref={zoomWindowRef}></div>
                    </>
                  )}
                </div>

              </div>

              <div className="mobile-thumbnails-container d-md-none">
                <div className="mobile-thumbnails-scroll">
                  {selectedVariant?.images?.map((img, index) => (
                    <div
                      key={index}
                      className={`mobile-thumbnail ${activeImageIndex === index ? "active" : ""}`}
                      onClick={() => handleThumbnailClick(index)}
                      onMouseEnter={() => handleThumbnailMouseEnter(index)}
                      onTouchStart={() => handleThumbnailHover(index)}
                      onMouseLeave={handleThumbnailMouseLeave}
                    >
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`${product.name} - view ${index + 1}`}
                        className="thumbnail-image"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/60x90?text=Image+Not+Found"; }}
                      />
                      {hoverIndex === index && (
                        <IconLink
                          iconType="wishlist"
                          className={`mobile-thumbnail-heart-icon ${wishlistItems.some((item) => Number(item.productId) === Number(product.id)) ? "filled" : ""
                            }`}
                          onClick={(e) => { e.stopPropagation(); handleWishlistToggle(); }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-md-6 product-details-container">
              <div className="product-details-content">
                <div className="brand-name" style={{ color: '#0058A3', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  {product.brand}
                </div>
                <h1 className="product-title">{product.name}</h1>
                <div className="availability mb-1">
                  <span className="d-flex align-items-center">
                    Material:
                    <span className="ms-2 d-flex align-items-center">{product.material || "N/A"}</span>
                  </span>
                </div>
                <hr className="my-2" />
                <div className="product-price mb-3">
                  <span className="current-price">
                    ₹
                    {selectedVariant
                      ? selectedVariant.price.toFixed(2)        // size + color based price
                      : product.price.toFixed(2)}              
                  </span>

                  {product.discount > 0 && (
                    <>
                      <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>
                      <span className="discount">-{product.discount}%</span>
                    </>
                  )}
                </div>
                <div className="availability mb-3">
                  <span className="d-flex align-items-center">
                    Availability:
                    <span className="ms-2 d-flex align-items-center">
                      <span className="stock-indicator me-2"></span>
                      {product.availability || "In Stock"}
                    </span>
                  </span>
                </div>
                <div className="color-selection mb-3">
                  <div className="mb-2">Color: {selectedColor}</div>
                  <div className="d-flex gap-2">
                    {/* {product.color.split(", ").map((color) => (
                      <button
                        key={color}
                        className={`color-btn ${selectedColor === color ? "active" : ""}`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))} */}
                    {filteredColors.length > 0 ? (
                      filteredColors.map((color) => (
                        <button
                          key={color}
                          className={`color-btn ${selectedColor === color ? "active" : ""}`}
                          style={{ backgroundColor: color.toLowerCase() }}
                          onClick={() => handleColorChange(color)}
                        />
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No colors for this size</span>
                    )}
                  </div>
                </div>
                <div className="size-selection mb-3">
                  <div className="mb-2">Size: {selectedSize}</div>
                  <div className="d-flex gap-2">
                    {[...new Set(product.size.split(", ").map(s => s.trim()))].map((size) => (
                      <button
                        key={size}
                        className={`size-btn ${selectedSize === size ? "active" : ""}`}
                        onClick={() => handleSizeChange(size)}
                      >
                        {size}
                      </button>
                    ))}

                  </div>
                </div>
                <div className="quantity-wishlist-container mb-3">
                  <div className="mb-2">Quantity</div>
                  <div className="quantity-with-wishlist d-flex align-items-center gap-3">
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="text"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                        className="quantity-input"
                      />
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <IconLink
                      iconType="wishlist"
                      className={`heart-icon-quantity ${
                        wishlistItems.some((item) => Number(item.productId) === Number(product.id)) ? "filled" : ""
                      }`}
                      onClick={handleWishlistToggle}
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <AddToCartButton
                    label="Add to Cart"
                    onClick={handleAddToCart}
                    showIcon={true}
                  />
                  <PurchaseNowTwoButton
                    label="Buy Now"
                    productId={product.slug}
                    onClick={handleBuyNow}
                    showIcon={true}
                  />
                </div>
                <div className="product-tabs mt-4">
                  <div className="tab-nav">
                    <button
                      className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
                      onClick={() => setActiveTab("specifications")}
                    >
                      Specifications
                    </button>
                    <button
                      className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
                      onClick={() => setActiveTab("about")}
                    >
                      About
                    </button>
                  </div>
                  <div className="tab-content">
                    {activeTab === "specifications" && (
                      <div className="specifications-tab">
                        <ul>
                          {Object.entries(product.specifications || {}).map(([key, value]) => (
                            <li key={key}>
                              <span className="meta-label">{key}:</span> {renderSpecificationValue(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {activeTab === "about" && (
                      <div className="about-tab">
                        <p className="product-detailed-description">{product.about}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <YouMayAlsoLike brand={product.brand} />
        <Newsletter />
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default ProductDetail;