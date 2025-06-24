'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ImageUploader from '../../../components/ImageUploader';
import VariantManager from '../../../../components/VariantManager';
import useProductVariants from '../../../../hooks/useProductVariants';
import { formatPrice, calculatePriceRange } from '../../../../utils/priceUtils';
import { 
  normalizeVariationAttributes, 
  normalizeVariantOptions, 
  normalizeProductImages, 
  normalizeProductTags,
  deepParseJSON 
} from '../../../../utils/jsonUtils';

interface DatabaseVariationAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  values: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>;
}

interface VariationAttribute {
  id: string;
  name: string;
  type: string;
  slug: string;
  values: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>;
}

interface Addon {
  id: string;
  title: string;
  price: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

interface SelectedAddon {
  addonId: string;
  addonTitle: string;
  price: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  // Use the custom hook for variants
  const { data: variantData, loading: variantsLoading, refetch: refetchVariants } = useProductVariants(productId);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    subcategoryId: '',
    tags: '',
    weight: '',
    isFeatured: false,
    isActive: true,
    isDigital: false,
    requiresShipping: true,
    taxable: true,
    metaTitle: '',
    metaDescription: '',
    productType: 'simple'
  });
  
  // Variable product specific states
  const [availableAttributes, setAvailableAttributes] = useState<DatabaseVariationAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<VariationAttribute[]>([]);
  const [variantsToDelete, setVariantsToDelete] = useState<string[]>([]);
  
  // Group product specific states
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProductAndInitialData();
  }, [productId]);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubcategories(formData.categoryId);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  const fetchProductAndInitialData = async () => {
    try {
      const [productRes, categoriesRes, attributesRes, addonsRes, productAddonsRes] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch('/api/categories'),
        fetch('/api/variation-attributes?includeValues=true'),
        fetch('/api/addons'),
        fetch(`/api/product-addons?productId=${productId}`)
      ]);
      
      const product = await productRes.json();
      const categoriesData = await categoriesRes.json();
      const attributesData = await attributesRes.json();
      const addonsData = await addonsRes.json();
      const productAddonsData = await productAddonsRes.json();
      
      // Parse product data using deep parsing utilities
      const productImages = normalizeProductImages(product.images);
      const productTags = normalizeProductTags(product.tags);
      const productVariationAttributes = normalizeVariationAttributes(product.variationAttributes);
      
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        sku: product.sku || '',
        price: product.price || '',
        comparePrice: product.comparePrice || '',
        costPrice: product.costPrice || '',
        categoryId: product.categoryId || '',
        subcategoryId: product.subcategoryId || '',
        tags: Array.isArray(productTags) ? productTags.join(', ') : '',
        weight: product.weight || '',
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== undefined ? product.isActive : true,
        isDigital: product.isDigital || false,
        requiresShipping: product.requiresShipping !== undefined ? product.requiresShipping : true,
        taxable: product.taxable !== undefined ? product.taxable : true,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        productType: product.productType || 'simple'
      });
      
      setImages(Array.isArray(productImages) ? productImages : []);
      setCategories(categoriesData);
      setAvailableAttributes(attributesData);
      
      // Auto-select attributes based on existing variants and saved variation attributes
      const attributesFromVariants = new Map<string, Set<string>>();
      
      // First, get attributes from existing variants if available
      if (variantData && variantData.variants.length > 0) {
        variantData.variants.forEach(variant => {
          // Normalize variant attributes using our utility
          const normalizedAttributes = normalizeVariantOptions(variant.attributes);
          Object.entries(normalizedAttributes).forEach(([attrName, attrValue]) => {
            if (!attributesFromVariants.has(attrName)) {
              attributesFromVariants.set(attrName, new Set());
            }
            attributesFromVariants.get(attrName)!.add(attrValue);
          });
        });
      }
      
      // If no variants but we have saved variation attributes, use those
      if (attributesFromVariants.size === 0 && productVariationAttributes.length > 0) {
        productVariationAttributes.forEach((attr: any) => {
          if (attr.name && attr.values && Array.isArray(attr.values)) {
            attributesFromVariants.set(attr.name, new Set(attr.values.map((v: any) => v.value || v)));
          }
        });
      }

      // Build the selected attributes array
      const autoSelectedAttributes: VariationAttribute[] = [];
      attributesFromVariants.forEach((values, attrName) => {
        const dbAttribute = attributesData.find((attr: any) => attr.name === attrName);
        if (dbAttribute) {
          const selectedValues = Array.from(values).map((value: string) => {
            const dbValue = dbAttribute.values.find((v: any) => v.value === value);
            return dbValue || {
              id: `temp_${value}`,
              value: value,
              slug: value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              colorCode: undefined,
              image: undefined
            };
          });
          
          autoSelectedAttributes.push({
            id: dbAttribute.id,
            name: dbAttribute.name,
            type: dbAttribute.type,
            slug: dbAttribute.slug,
            values: selectedValues
          });
        }
      });
      
      setSelectedAttributes(autoSelectedAttributes);
      
      // Set available addons
      setAvailableAddons(addonsData.filter((addon: Addon) => addon.isActive));
      
      // Convert existing product addons to our format
      const formattedProductAddons = productAddonsData.map((item: any) => ({
        addonId: item.productAddon.addonId,
        addonTitle: item.addon.title,
        price: item.productAddon.price,
        isRequired: item.productAddon.isRequired,
        sortOrder: item.productAddon.sortOrder,
        isActive: item.productAddon.isActive
      }));
      
      setSelectedAddons(formattedProductAddons);
      
    } catch (err) {
      console.error(err);
      setError('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const res = await fetch('/api/subcategories');
      const data = await res.json();
      const filtered = data.filter((sub: any) => sub.categoryId === categoryId);
      setSubcategories(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleImageUpload = (imageUrl: string) => {
    setImages([...images, imageUrl]);
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Variant management functions using our optimized hook
  const handleVariantUpdate = async (variantId: string, field: string, value: any) => {
    try {
      const response = await fetch(`/api/product-variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      if (response.ok) {
        await refetchVariants(); // Refresh variant data
      }
    } catch (error) {
      console.error('Error updating variant:', error);
    }
  };

  const handleVariantDelete = (variantId: string) => {
    setVariantsToDelete([...variantsToDelete, variantId]);
  };

  // Addon management functions
  const addSelectedAddon = (addonId: string) => {
    const addon = availableAddons.find(addon => addon.id === addonId);
    if (!addon) return;

    const isAlreadySelected = selectedAddons.some(selected => selected.addonId === addonId);
    if (isAlreadySelected) return;

    setSelectedAddons([...selectedAddons, {
      addonId: addon.id,
      addonTitle: addon.title,
      price: addon.price,
      isRequired: false,
      sortOrder: selectedAddons.length,
      isActive: true
    }]);
  };

  const updateSelectedAddon = (addonId: string, field: keyof SelectedAddon, value: any) => {
    const updated = selectedAddons.map(addon => 
      addon.addonId === addonId 
        ? { ...addon, [field]: value }
        : addon
    );
    setSelectedAddons(updated);
  };

  const removeSelectedAddon = (addonId: string) => {
    setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== addonId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate group products with zero price must have addons
    if (formData.productType === 'group' && (!formData.price || parseFloat(formData.price) === 0) && selectedAddons.length === 0) {
      setError('Group products with zero price must have at least one addon');
      setSubmitting(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : (formData.productType === 'group' ? 0 : parseFloat(formData.price)),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: images.length > 0 ? images : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        variationAttributes: formData.productType === 'variable' ? selectedAttributes : null,
        variantsToDelete: variantsToDelete.length > 0 ? variantsToDelete : null,
        addons: formData.productType === 'group' ? selectedAddons : null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || variantsLoading) return <div className="p-8">Loading...</div>;

  // Calculate price range for variable products
  const priceRange = variantData ? calculatePriceRange(variantData.variants) : null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Price Range Display for Variable Products */}
      {formData.productType === 'variable' && variantData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Variable Product Pricing</h3>
              <p className="text-blue-700">
                {priceRange?.hasRange 
                  ? `Price Range: ${priceRange.range}`
                  : `Fixed Price: ${priceRange?.range}`
                }
              </p>
            </div>
            <div className="text-blue-700">
              <span className="text-2xl font-bold">{variantData.totalVariants}</span>
              <span className="text-sm ml-1">variants</span>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-6xl">
        {/* Product Type Selection */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Product Type</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="simple"
                checked={formData.productType === 'simple'}
                onChange={handleChange}
                className="mr-2"
              />
              Simple Product
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="variable"
                checked={formData.productType === 'variable'}
                onChange={handleChange}
                className="mr-2"
              />
              Variable Product (with variations)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="group"
                checked={formData.productType === 'group'}
                onChange={handleChange}
                className="mr-2"
              />
              Group Product (with addons)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="slug">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                placeholder="auto-generated-from-name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="shortDescription">
                Short Description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="sku">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Column - Pricing & Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing & Details</h3>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="price">
                Price {formData.productType !== 'group' && <span className="text-red-500">*</span>}
                {formData.productType === 'group' && (
                  <span className="text-sm text-gray-500 block">
                    (Optional for group products - price will come from addons)
                  </span>
                )}
                {formData.productType === 'variable' && (
                  <span className="text-sm text-gray-500 block">
                    (Base price - individual variants can override this)
                  </span>
                )}
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
                required={formData.productType !== 'group'}
                placeholder={formData.productType === 'group' ? '0.00 (optional)' : ''}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="comparePrice">
                Compare Price
              </label>
              <input
                type="number"
                id="comparePrice"
                name="comparePrice"
                value={formData.comparePrice}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="costPrice">
                Cost Price
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="subcategoryId">
                Subcategory
              </label>
              <select
                id="subcategoryId"
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                disabled={!formData.categoryId}
              >
                <option value="">Select a subcategory</option>
                {subcategories.map((subcategory: any) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="tags">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="weight">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Product Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img src={image} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <ImageUploader
            currentImage=""
            onImageUpload={handleImageUpload}
            onImageRemove={() => {}}
            label="Add Product Image"
            disabled={submitting}
            directory="products"
          />
        </div>

        {/* Variable Product Variants - Using our optimized VariantManager */}
        {formData.productType === 'variable' && variantData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">🔧 Product Variants</h3>
            <p className="text-gray-600 mb-4">
              Manage individual variant pricing, inventory, and settings. Variants are automatically organized by their attributes.
            </p>
            
            <VariantManager
              variants={variantData.variants}
              onVariantUpdate={handleVariantUpdate}
              onVariantDelete={handleVariantDelete}
              isEditing={true}
            />
          </div>
        )}

        {/* Group Product Addons */}
        {formData.productType === 'group' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">🧩 Product Addons</h3>
            
            {/* Add New Addon */}
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Add Addon to Product</h4>
              <select
                onChange={(e) => e.target.value && addSelectedAddon(e.target.value)}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                value=""
              >
                <option value="">Select an addon to add...</option>
                {availableAddons
                  .filter(addon => !selectedAddons.some(selected => selected.addonId === addon.id))
                  .map((addon) => (
                    <option key={addon.id} value={addon.id}>
                      {addon.title} - ${parseFloat(addon.price).toFixed(2)}
                    </option>
                  ))}
              </select>
              {availableAddons.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No addons available. <a href="/addons/add" className="text-blue-500 hover:underline">Create some addons first</a>.
                </p>
              )}
            </div>

            {/* Selected Addons */}
            <div className="space-y-4">
              {selectedAddons.map((selectedAddon) => {
                const addon = availableAddons.find(a => a.id === selectedAddon.addonId);

                return (
                  <div key={selectedAddon.addonId} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">
                        {selectedAddon.addonTitle}
                        {addon?.description && (
                          <span className="block text-sm text-gray-600">{addon.description}</span>
                        )}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeSelectedAddon(selectedAddon.addonId)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Override Price ($)
                        </label>
                        <input
                          type="number"
                          value={selectedAddon.price}
                          onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'price', e.target.value)}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          step="0.01"
                          min="0"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Original price: ${addon ? parseFloat(addon.price).toFixed(2) : '0.00'}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={selectedAddon.sortOrder}
                          onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'sortOrder', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          min="0"
                        />
                      </div>

                      <div className="flex flex-col justify-center space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAddon.isRequired}
                            onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'isRequired', e.target.checked)}
                            className="mr-2"
                          />
                          Required Addon
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAddon.isActive}
                            onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'isActive', e.target.checked)}
                            className="mr-2"
                          />
                          Active
                        </label>
                      </div>
                    </div>

                    {addon?.image && (
                      <div className="mt-3">
                        <img 
                          src={addon.image} 
                          alt={addon.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedAddons.length === 0 && (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                No addons selected. 
                {(!formData.price || parseFloat(formData.price) === 0) ? (
                  <span className="block text-red-500 font-medium mt-1">
                    You must add at least one addon for group products with zero price.
                  </span>
                ) : (
                  <span>Add some addons to create a group product.</span>
                )}
              </div>
            )}

            {/* Group Product Pricing Summary */}
            {formData.productType === 'group' && selectedAddons.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Pricing Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Product Price:</span>
                    <span>${formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Addon Prices:</span>
                    <span>${selectedAddons.reduce((total, addon) => total + parseFloat(addon.price), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-blue-300">
                    <span>Maximum Product Price:</span>
                    <span>${(
                      (formData.price ? parseFloat(formData.price) : 0) + 
                      selectedAddons.reduce((total, addon) => total + parseFloat(addon.price), 0)
                    ).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    * Final price depends on which addons customer selects
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="mr-2"
              />
              Featured Product
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              Active
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isDigital"
                checked={formData.isDigital}
                onChange={handleChange}
                className="mr-2"
              />
              Digital Product
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiresShipping"
                checked={formData.requiresShipping}
                onChange={handleChange}
                className="mr-2"
              />
              Requires Shipping
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="taxable"
                checked={formData.taxable}
                onChange={handleChange}
                className="mr-2"
              />
              Taxable
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="metaTitle">
                Meta Title
              </label>
              <input
                type="text"
                id="metaTitle"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="metaDescription">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 