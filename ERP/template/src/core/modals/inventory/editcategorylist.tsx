import React, { useState, useEffect, useRef } from "react";
import { CategoryService, type Category } from "../../../feature-module/services/category.service";

interface EditCategoryListProps {
  category: Category | null;
  onUpdate: () => void;
}

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const EditCategoryList: React.FC<EditCategoryListProps> = ({ category, onUpdate }) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setStatus(category.status);
    }
  }, [category]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim()) return;
    
    setLoading(true);
    try {
      await CategoryService.update(category.id, {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        status,
      });
      onUpdate();
      closeBtnRef.current?.click();
    } catch (error: any) {
      alert(error.message || "Error updating category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="edit-category">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="modal-header">
                <div className="page-title">
                  <h4>Edit Category</h4>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="close bg-danger text-white fs-16"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label">
                      Category<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setName(val);
                        setSlug(slugify(val));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Category Slug<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      required
                    />
                  </div>
                  <div className="mb-0">
                    <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                      <span className="status-label">
                        Status<span className="text-danger ms-1">*</span>
                      </span>
                      <input
                        type="checkbox"
                        id="category-edit-status"
                        className="check"
                        checked={status === "Active"}
                        onChange={(e) =>
                          setStatus(e.target.checked ? "Active" : "Inactive")
                        }
                      />
                      <label htmlFor="category-edit-status" className="checktoggle" />
                    </div>
                  </div>
                  <div className="modal-footer px-0 pb-0 pt-3">
                    <button
                      type="button"
                      className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-submit fs-13 fw-medium p-2 px-3"
                      disabled={loading}
                    >
                      {loading && <span className="spinner-border spinner-border-sm me-1" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryList;
