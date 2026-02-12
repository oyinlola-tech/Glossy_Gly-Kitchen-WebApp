import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { Plus, Edit, Trash2, Search, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  imageUrl?: string;
  currency?: string;
  available?: boolean;
}

interface FoodCategory {
  id: string;
  name: string;
  foodCount: number;
}

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

export const Foods: React.FC = () => {
  const { token } = useAdminAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    available: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());
  const [removeImage, setRemoveImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [foodsResponse, categoriesResponse] = await Promise.all([
        apiService.getAdminFoods(token),
        apiService.getFoodCategories(),
      ]);
      setFoods(foodsResponse);
      setBrokenImageIds(new Set());
      setCategories(categoriesResponse);
    } catch {
      toast.error('Failed to load foods and categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (food?: Food) => {
    if (food) {
      setEditingFood(food);
      setFormData({
        name: food.name,
        description: food.description || '',
        price: food.price.toString(),
        categoryId: food.categoryId || '',
        available: Boolean(food.available),
      });
      setImagePreviewUrl(food.imageUrl || '');
    } else {
      setEditingFood(null);
      setFormData({ name: '', description: '', price: '', categoryId: '', available: true });
      setImagePreviewUrl('');
    }
    setImageFile(null);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setRemoveImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFood(null);
    setFormData({ name: '', description: '', price: '', categoryId: '', available: true });
    setImageFile(null);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setImagePreviewUrl('');
    setRemoveImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleCategoryCreate = async () => {
    if (!token) return;
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Enter a category name');
      return;
    }

    try {
      await apiService.createFoodCategory(token, name);
      setNewCategoryName('');
      const latestCategories = await apiService.getFoodCategories();
      setCategories(latestCategories);
      toast.success('Category created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!formData.categoryId) {
      toast.error('Please choose a category');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        categoryId: formData.categoryId,
        currency: 'NGN',
        available: formData.available,
      };

      if (imageFile) {
        payload.imageDataUrl = await fileToDataUrl(imageFile);
        payload.imageFileName = imageFile.name;
      }
      if (removeImage && editingFood) {
        payload.removeImage = true;
      }

      if (editingFood) {
        await apiService.adminUpdateFood(token, editingFood.id, payload);
        toast.success('Meal updated successfully');
      } else {
        await apiService.adminCreateFood(token, payload);
        toast.success('Meal created successfully');
      }
      handleCloseModal();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Mark this meal as unavailable?')) return;
    try {
      await apiService.adminDeleteFood(token, id);
      toast.success('Meal marked unavailable');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (food.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Meals</h2>
          <p className="text-slate-600">Admin-managed meals, categories, images, and NGN pricing</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Meal
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search meals..."
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
          />
          <button
            type="button"
            onClick={handleCategoryCreate}
            className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Image</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Category</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Price</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {food.imageUrl && !brokenImageIds.has(food.id) ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setBrokenImageIds((prev) => {
                              const next = new Set(prev);
                              next.add(food.id);
                              return next;
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 text-center px-1">
                          No Image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{food.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {food.category || categoryNameById[food.categoryId || ''] || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{NGN_FORMATTER.format(Number(food.price || 0))}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${food.available ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                      {food.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(food)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl p-8 max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-6">
              {editingFood ? 'Edit Meal' : 'Add Meal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meal Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.foodCount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price (NGN) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meal Image</label>
                <label className="w-full p-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-purple-500 transition-colors">
                  <ImagePlus className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-600">{imageFile ? imageFile.name : 'Choose image file'}</span>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      setImageFile(file);
                      setRemoveImage(false);
                      if (previewObjectUrl) {
                        URL.revokeObjectURL(previewObjectUrl);
                        setPreviewObjectUrl(null);
                      }
                      if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        setPreviewObjectUrl(objectUrl);
                        setImagePreviewUrl(objectUrl);
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {editingFood?.imageUrl && (
                  <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={removeImage}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRemoveImage(checked);
                        if (checked) {
                          setImageFile(null);
                          if (previewObjectUrl) {
                            URL.revokeObjectURL(previewObjectUrl);
                            setPreviewObjectUrl(null);
                          }
                          if (imageInputRef.current) {
                            imageInputRef.current.value = '';
                          }
                        }
                      }}
                    />
                    Remove existing image
                  </label>
                )}
                {imagePreviewUrl && !removeImage && (
                  <div
                    className="mt-3 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center"
                    style={{ width: '160px', height: '160px' }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="object-cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                />
                Available for ordering
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingFood ? 'Update Meal' : 'Create Meal'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
