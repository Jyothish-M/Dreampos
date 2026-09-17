import{r as a,s as V,j as e,T as W,R as X,C as Z,L as r,a as A,S as ee,P as te}from"./index-Ddkxz7CW.js";import{h as de}from"./html2pdf-DQZzuBvS.js";import{P as n}from"./product.service-Dwm_lKhc.js";import{C as se}from"./category.service-_lmYzL7e.js";import{B as ae}from"./brand.service-ZO4rzCsU.js";const ce=()=>{const[u,o]=a.useState(1),[D,B]=a.useState(0),[i,j]=a.useState(10),[g,R]=a.useState(void 0),[l,N]=a.useState([]),[T,E]=a.useState([]),[w,x]=a.useState(null),[v,F]=a.useState([]),[k,q]=a.useState([]),[c,L]=a.useState(null),[m,U]=a.useState(null),[h,f]=a.useState(!1),[C,b]=a.useState(null);a.useEffect(()=>{Q()},[]);const Q=async()=>{try{const t=await se.getAll();F(t);const d=await ae.getBrands(1,1e3);q(d.data||[])}catch(t){console.error("Error fetching filters:",t)}};a.useEffect(()=>{y()},[u,i,g,c,m]);const y=async()=>{b(null);try{const t=await n.getAll({page:u,limit:i,search:g,category:c||void 0,brand:m||void 0}),d=t.data.map(s=>({id:s.id,product:s.product,productImage:s.productImage||V,sku:s.sku,category:s.category||"N/A",brand:s.brand||"N/A",price:`₹${s.price}`,unit:s.unit||"Pc",qty:s.quantity||"0",itemCode:s.itemCode||"N/A"}));E(d),B(t.total)}catch(t){const d=t?.response?.data?.message||t?.message||"Failed to load products. Please try again.";b(d)}},H=t=>{R(t),o(1)},S=t=>{L(t),o(1)},P=t=>{U(t),o(1)},M=t=>{j(t),o(1)},I=async t=>{try{await n.export(t)}catch(d){console.error(`Export ${t} failed:`,d)}},K=async t=>{try{const d=await n.getById(t),s=d.images?.[0]?.url||"",G=d.categoryId&&typeof d.categoryId=="object"?d.categoryId.name:d.categoryId||"N/A",O=d.brandId&&typeof d.brandId=="object"?d.brandId.name:d.brandId||"N/A",Y=d.unitId&&typeof d.unitId=="object"?d.unitId.name:d.unitId||"N/A",J=`
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color:#444;border-bottom:2px solid #eee;padding-bottom:10px;">Product Details</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr style="background:#f9f9f9">
              <td style="padding:10px;font-weight:bold;width:35%;">Product Name</td>
              <td style="padding:10px;">${d.product}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;">SKU</td>
              <td style="padding:10px;">${d.sku}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px;font-weight:bold;">HSN/SAC Number</td>
              <td style="padding:10px;">${d.itemCode||"N/A"}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;">Category</td>
              <td style="padding:10px;">${G}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px;font-weight:bold;">Brand</td>
              <td style="padding:10px;">${O}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;">Unit</td>
              <td style="padding:10px;">${Y}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px;font-weight:bold;">Tax Type</td>
              <td style="padding:10px;">${d.taxType||"N/A"}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;">Tax Rate</td>
              <td style="padding:10px;">${d.taxRate||0}%</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px;font-weight:bold;">Price (Before Tax)</td>
              <td style="padding:10px;">₹${d.priceBeforeTax}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;">Price (After Tax)</td>
              <td style="padding:10px;font-weight:bold;color:#27ae60;">₹${d.priceAfterTax}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px;font-weight:bold;">Quantity</td>
              <td style="padding:10px;">${d.quantity}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;">Status</td>
              <td style="padding:10px;">${d.status}</td>
            </tr>
            ${d.description?`<tr style="background:#f9f9f9"><td style="padding:10px;font-weight:bold;">Description</td><td style="padding:10px;">${d.description.replace(/<[^>]+>/g,"")}</td></tr>`:""}
          </table>
          ${s?`<div style="margin-top:10px;"><p style="font-weight:bold;">Product Image:</p><img src="${s}" style="max-width:200px;border-radius:6px;border:1px solid #eee;"/></div>`:""}
          <p style="margin-top:20px;font-size:12px;color:#aaa;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      `,p=document.createElement("div");p.innerHTML=J,document.body.appendChild(p),await de().set({margin:10,filename:`Product_${d.sku||t}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).from(p).save(),document.body.removeChild(p)}catch(d){console.error("Download PDF failed:",d)}},_=async()=>{try{if(h){if(l.length===0)return;const d=l.map(s=>s.id);await n.bulkDelete(d),N([])}else{if(!w)return;await n.delete(w)}y(),document.querySelector('#delete-modal [data-bs-dismiss="modal"]')?.click(),x(null),f(!1)}catch(t){console.error("Error deleting:",t)}},$=A,z=[{header:"SKU",field:"sku",key:"sku",sortable:!0},{header:"Product",field:"product",key:"product",sortable:!0,body:t=>e.jsxs("div",{className:"d-flex align-items-center",children:[e.jsx("img",{src:t.productImage,alt:t.product,className:"me-2 rounded",style:{width:36,height:36,objectFit:"cover"}}),e.jsx(r,{to:"#",children:t.product})]})},{header:"HSN/SAC Number",field:"itemCode",key:"itemCode",sortable:!0},{header:"Category",field:"category",key:"category",sortable:!0},{header:"Brand",field:"brand",key:"brand",sortable:!0},{header:"Price",field:"price",key:"price",sortable:!0},{header:"Unit",field:"unit",key:"unit",sortable:!0},{header:"Qty",field:"qty",key:"qty",sortable:!0},{header:"",field:"actions",key:"actions",sortable:!1,body:t=>e.jsxs("div",{className:"edit-delete-action d-flex align-items-center",children:[e.jsx(r,{className:"me-2 p-2 d-flex align-items-center border rounded",to:`${$.productdetails}/${t.id}`,children:e.jsx("i",{className:"feather icon-eye"})}),e.jsx(r,{className:"me-2 p-2 d-flex align-items-center border rounded",to:"#",onClick:d=>{d.preventDefault(),K(String(t.id))},title:"Download PDF",children:e.jsx("i",{className:"feather icon-download"})}),e.jsx(r,{className:"me-2 p-2 d-flex align-items-center border rounded",to:`${A.editproduct}/${t.id}`,children:e.jsx("i",{className:"feather icon-edit"})}),e.jsx(r,{className:"p-2 d-flex align-items-center border rounded",to:"#","data-bs-toggle":"modal","data-bs-target":"#delete-modal",onClick:()=>{x(String(t.id)),f(!1)},children:e.jsx("i",{className:"feather icon-trash-2"})})]})}];return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"page-wrapper",children:e.jsxs("div",{className:"content",children:[e.jsxs("div",{className:"page-header",children:[e.jsx("div",{className:"add-item d-flex",children:e.jsxs("div",{className:"page-title",children:[e.jsx("h4",{children:"Product List"}),e.jsx("h6",{children:"Manage your products"})]})}),e.jsxs("ul",{className:"table-top-head",children:[e.jsx(W,{onPdfClick:()=>I("pdf"),onExcelClick:()=>I("xlsx")}),e.jsx(X,{onClick:y}),e.jsx(Z,{})]}),e.jsx("div",{className:"page-btn",children:e.jsxs(r,{to:$.addproduct,className:"btn btn-primary",children:[e.jsx("i",{className:"ti ti-circle-plus me-1"}),"Add Product"]})}),e.jsx("div",{className:"page-btn import",children:e.jsxs(r,{to:"#",className:"btn btn-secondary color","data-bs-toggle":"modal","data-bs-target":"#view-notes",children:[e.jsx("i",{className:"feather icon-download feather me-2"}),"Import Product"]})})]}),e.jsxs("div",{className:"card table-list-card",children:[e.jsxs("div",{className:"card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3",children:[e.jsx(ee,{callback:H,rows:i,setRows:M}),e.jsxs("div",{className:"d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3",children:[e.jsxs("div",{className:"dropdown me-2",children:[e.jsx(r,{to:"#",className:"dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center","data-bs-toggle":"dropdown",children:c?v.find(t=>t.id===c)?.name:"Category"}),e.jsxs("ul",{className:"dropdown-menu dropdown-menu-end p-3",children:[e.jsx("li",{children:e.jsx(r,{to:"#",className:"dropdown-item rounded-1",onClick:()=>S(null),children:"All Categories"})}),v.map(t=>e.jsx("li",{children:e.jsx(r,{to:"#",className:"dropdown-item rounded-1",onClick:()=>S(t.id),children:t.name})},t.id))]})]}),e.jsxs("div",{className:"dropdown me-2",children:[e.jsx(r,{to:"#",className:"dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center","data-bs-toggle":"dropdown",children:m?k.find(t=>t.id===m)?.name:"Brand"}),e.jsxs("ul",{className:"dropdown-menu dropdown-menu-end p-3",children:[e.jsx("li",{children:e.jsx(r,{to:"#",className:"dropdown-item rounded-1",onClick:()=>P(null),children:"All Brands"})}),k.map(t=>e.jsx("li",{children:e.jsx(r,{to:"#",className:"dropdown-item rounded-1",onClick:()=>P(t.id),children:t.name})},t.id))]})]}),l.length>0&&e.jsx("div",{className:"dropdown me-2",children:e.jsxs("button",{className:"btn btn-danger btn-md d-inline-flex align-items-center","data-bs-toggle":"modal","data-bs-target":"#delete-modal",onClick:()=>{f(!0),x(null)},children:[e.jsx("i",{className:"ti ti-trash me-1"}),"Delete Selected (",l.length,")"]})})]})]}),e.jsxs("div",{className:"card-body",children:[C&&e.jsxs("div",{className:"alert alert-danger alert-dismissible fade show d-flex align-items-center mb-3",role:"alert",children:[e.jsx("i",{className:"feather icon-alert-circle me-2 fs-18"}),e.jsx("span",{children:C}),e.jsx("button",{type:"button",className:"btn-close ms-auto",onClick:()=>b(null),"aria-label":"Close"})]}),e.jsx("div",{className:"table-responsive",children:e.jsx(te,{column:z,data:T,rows:i,setRows:j,currentPage:u,setCurrentPage:o,totalRecords:D,searchQuery:g,loading:!1,selectionMode:"checkbox",selection:l,onSelectionChange:t=>N(t.value)})})]})]})]})}),e.jsx("div",{className:"modal fade",id:"delete-modal",children:e.jsx("div",{className:"modal-dialog modal-dialog-centered",children:e.jsx("div",{className:"modal-content",children:e.jsx("div",{className:"page-wrapper-new p-0",children:e.jsxs("div",{className:"content p-5 px-3 text-center",children:[e.jsx("span",{className:"rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2",children:e.jsx("i",{className:"ti ti-trash fs-24 text-danger"})}),e.jsx("h4",{className:"fs-20 fw-bold mb-2 mt-1",children:h?"Delete Selected Products":"Delete Product"}),e.jsx("p",{className:"mb-0 fs-16",children:h?`Are you sure you want to delete ${l.length} selected products?`:"Are you sure you want to delete this product?"}),e.jsxs("div",{className:"modal-footer-btn mt-3 d-flex justify-content-center",children:[e.jsx("button",{type:"button",className:"btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none","data-bs-dismiss":"modal",children:"Cancel"}),e.jsx("button",{type:"button",className:"btn btn-primary fs-13 fw-medium p-2 px-3",onClick:_,children:"Yes Delete"})]})]})})})})})]})};export{ce as default};
