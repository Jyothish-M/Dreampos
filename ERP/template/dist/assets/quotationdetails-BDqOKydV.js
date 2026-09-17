import{u as g,F as w,cn as y,r as n,j as e,L as h,a as v,ci as S,c as D}from"./index-Ddkxz7CW.js";import{Q as p}from"./quotation.service-CgO-XFp2.js";import{B as I}from"./bank.service-CDSGyTg6.js";import{I as T}from"./invoice.service-BLBchpdg.js";const P=()=>{const o=v,j=g(),{id:r}=w(),[l]=y(),[t,d]=n.useState(null),[i,u]=n.useState(null),[c,m]=n.useState(!0);n.useEffect(()=>{r&&(m(!0),Promise.all([p.getById(r),I.getAllBankAccounts({status:!0}).catch(()=>({data:[]}))]).then(([s,a])=>{d(s.data??s);const b=a.data.find(f=>f.isDefault)||a.data[0];u(b)}).catch(()=>d(null)).finally(()=>m(!1)))},[r]);const N=()=>window.print(),x=n.useCallback(async()=>{if(t?.id)try{await p.downloadSinglePdf(t.id,t.quotationNo)}catch(s){console.error("Download failed:",s)}},[t]);return n.useEffect(()=>{!t||c||l.get("download")==="true"&&setTimeout(()=>{x(),l.get("close")==="true"&&setTimeout(()=>{window.parent!==window?console.log("Download complete inside iframe"):window.close()},3e3)},1e3)},[t,c,l]),c?e.jsx("div",{className:"page-wrapper",children:e.jsx("div",{className:"content",children:e.jsx("div",{className:"text-center py-5",children:e.jsx("div",{className:"spinner-border text-primary",role:"status",children:e.jsx("span",{className:"visually-hidden",children:"Loading..."})})})})}):t?e.jsxs("div",{children:[e.jsx("style",{children:`
        @media print {
          .page-header, .footer-actions, .main-footer { display: none !important; }
          .page-wrapper { margin: 0 !important; padding: 0 !important; }
          .card { border: none !important; box-shadow: none !important; }
        }
        .quotation-container {
          font-family: 'Inter', sans-serif;
          color: #000;
          background: #fff;
          padding: 20px;
        }
        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000;
          margin-bottom: 0px;
        }
        .quotation-table th, .quotation-table td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 13px;
        }
        .quotation-table thead th {
          background-color: #fff;
          text-align: center;
          font-weight: 700;
          vertical-align: middle;
        }
        .text-header-red { color: #800040; font-weight: 600; font-size: 18px; }
        .company-title { font-size: 22px; font-weight: 800; color: #000; margin-bottom: 5px; }
        .billed-to-section { margin-top: 20px; border-top: 1px solid #000; padding-top: 15px; }
        .total-box {
          border: 1.5px solid #000;
          border-top: none;
          padding: 10px;
        }
        .amount-in-words {
          border: 1.5px solid #000;
          border-top: none;
          padding: 12px;
          font-weight: 700;
          font-size: 15px;
        }
        .note-signature-section {
          display: flex;
          border: 1.5px solid #000;
          border-top: none;
        }
        .notes-area {
          flex: 1;
          border-right: 1.5px solid #000;
          padding: 10px;
          font-size: 12px;
        }
        .signature-area {
          width: 300px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          min-height: 100px;
        }
      `}),e.jsxs("div",{className:"page-wrapper",children:[e.jsxs("div",{className:"content",children:[e.jsxs("div",{className:"page-header d-print-none",children:[e.jsxs("div",{className:"page-title",children:[e.jsx("h4",{children:"Quotation View"}),e.jsx("h6",{children:"View and Print Quotation"})]}),e.jsx("div",{className:"page-btn",children:e.jsxs(h,{to:o.quotationlist,className:"btn btn-primary",children:[e.jsx("i",{className:"feather icon-arrow-left me-2"}),"Back to List"]})})]}),e.jsx("div",{className:"card shadow-none border-0",id:"quotation-content",children:e.jsxs("div",{className:"card-body quotation-container",children:[e.jsxs("div",{className:"row mb-2",children:[e.jsxs("div",{className:"col-6",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("img",{src:S,alt:"Logo",style:{maxHeight:"60px",marginBottom:"10px"}}),e.jsx("h1",{className:"fw-bold m-0",style:{fontSize:"32px",letterSpacing:"1px"},children:"QUOTATION"})]}),e.jsxs("div",{className:"mt-4",style:{fontSize:"15px"},children:[e.jsxs("p",{className:"mb-1",children:[e.jsx("strong",{children:"Quote Ref No:"})," ",t.quotationNo]}),e.jsxs("p",{className:"mb-1",children:[e.jsx("strong",{children:"Quote Date:"})," ",new Date(t.date).toLocaleDateString("en-GB")]}),e.jsxs("p",{className:"mb-0",children:[e.jsx("strong",{children:"Quote Validity:"})," ",t.validity?new Date(t.validity).toLocaleDateString("en-GB"):"—"]})]})]}),e.jsxs("div",{className:"col-6 text-end",children:[e.jsx("p",{className:"text-header-red mb-0",children:"Quotation From"}),e.jsx("h2",{className:"company-title",children:"WEBERFOX TECHNOLOGIES PVT LTD."}),e.jsxs("div",{style:{fontSize:"14px",lineHeight:"1.4"},children:[e.jsx("p",{className:"mb-0",children:"Building No :15/538, Koivila PO."}),e.jsx("p",{className:"mb-0",children:"Thevalakkara , Kollam"}),e.jsx("p",{className:"mb-0",children:"PIN:691590"}),e.jsx("p",{className:"mb-0",children:"Ph: +91 9496269666"}),e.jsx("p",{className:"mb-0",children:"e-mail: contact@weberfox.com"}),e.jsx("p",{className:"mb-0",children:e.jsx("strong",{children:"GSTIN: 32AADCW0489R1ZQ"})})]})]})]}),e.jsx("div",{style:{borderTop:"1.5px solid #000",margin:"10px 0"}}),e.jsxs("div",{className:"row mb-4",children:[e.jsxs("div",{className:"col-6",children:[e.jsx("h5",{className:"fw-bold mb-2",style:{fontSize:"18px",borderBottom:"1px solid #ddd",display:"inline-block"},children:"Billed to"}),e.jsxs("div",{style:{fontSize:"14px"},children:[e.jsx("h6",{className:"fw-bold mb-1",children:t.customerName}),t.customerAddress?e.jsx("p",{className:"mb-1",style:{whiteSpace:"pre-wrap"},children:t.customerAddress}):e.jsx("p",{className:"mb-1",children:"Customer Address Not Provided"}),t.customerGstin&&e.jsx("p",{className:"mb-1",children:e.jsxs("strong",{children:["GSTIN : ",t.customerGstin]})}),e.jsxs("p",{className:"mb-0",children:[e.jsx("strong",{children:"Place of Supply:"})," ",t.placeOfSupply||"Kerala (32)"]})]})]}),e.jsxs("div",{className:"col-6 text-end",children:[e.jsx("h5",{className:"fw-bold mb-2",style:{fontSize:"18px",borderBottom:"1px solid #ddd",display:"inline-block"},children:"Payment Details"}),e.jsxs("div",{style:{fontSize:"14px"},children:[e.jsxs("p",{className:"mb-1",children:[e.jsx("strong",{children:"Bank Acc No:"})," ",i?.accountNumber||"921020052009341"]}),e.jsxs("p",{className:"mb-1",children:[e.jsx("strong",{children:"IFSC :"})," ",i?.ifsc||"UTIB0000081"]}),e.jsxs("p",{className:"mb-0",children:[i?.bankName||"Axis Bank",","," ",i?.branch||"Kochi Branch"]})]})]})]}),e.jsx("div",{className:"mb-3",children:e.jsx("h5",{className:"fw-bold text-decoration-underline",style:{fontSize:"17px"},children:t.description||`Quotation for ${t.items?.[0]?.productName||"Components"}`})}),e.jsxs("table",{className:"quotation-table",children:[e.jsxs("thead",{children:[e.jsxs("tr",{children:[e.jsx("th",{rowSpan:2,style:{width:"50px"},children:"Sl. No."}),e.jsx("th",{rowSpan:2,children:"Item & Description"}),e.jsx("th",{rowSpan:2,style:{width:"100px"},children:"HSN/SAC"}),e.jsx("th",{rowSpan:2,style:{width:"60px"},children:"Qty."}),e.jsx("th",{rowSpan:2,style:{width:"100px"},children:"Rate"}),e.jsx("th",{rowSpan:2,style:{width:"100px"},children:"Amt."}),e.jsx("th",{colSpan:2,children:"IGST"}),e.jsx("th",{rowSpan:2,style:{width:"120px"},children:"Total Amount (Inc. IGST)"})]}),e.jsxs("tr",{children:[e.jsx("th",{style:{width:"60px"},children:"%"}),e.jsx("th",{style:{width:"100px"},children:"Amt."})]})]}),e.jsxs("tbody",{children:[(t.items||[]).map((s,a)=>e.jsxs("tr",{children:[e.jsx("td",{className:"text-center",children:a+1}),e.jsxs("td",{children:[e.jsx("div",{className:"fw-bold",children:s.productName||s.product}),s.productDescription&&e.jsx("div",{className:"small text-muted",children:s.productDescription})]}),e.jsx("td",{className:"text-center",children:s.hsnSac||"—"}),e.jsx("td",{className:"text-center",children:s.qty}),e.jsx("td",{className:"text-end",children:(Number(s.rate)||0).toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{className:"text-end",children:(s.qty*(Number(s.rate)||0)).toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{className:"text-center",children:s.taxPercent||0}),e.jsx("td",{className:"text-end",children:(Number(s.taxAmount)||0).toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{className:"text-end fw-bold",children:(Number(s.totalCost||s.total)||0).toLocaleString("en-IN",{minimumFractionDigits:2})})]},a)),e.jsxs("tr",{className:"fw-bold",style:{backgroundColor:"#f9f9f9"},children:[e.jsx("td",{colSpan:3,className:"text-center",children:"TOTAL"}),e.jsx("td",{className:"text-center",children:(t.items||[]).reduce((s,a)=>s+(Number(a.qty)||0),0)}),e.jsx("td",{}),e.jsx("td",{className:"text-end",children:(Number(t.subtotal)||0).toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{}),e.jsx("td",{className:"text-end",children:(Number(t.totalTax)||0).toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{className:"text-end",children:(Number(t.grandTotal)||0).toLocaleString("en-IN",{minimumFractionDigits:2})})]})]})]}),e.jsx("div",{className:"total-box",children:e.jsx("div",{className:"row align-items-center",children:e.jsx("div",{className:"col-12 text-center",children:e.jsxs("h5",{className:"fw-bold mb-0",style:{fontSize:"18px"},children:["Total Invoice Amount (Rounded off) : ₹",Math.round(t.grandTotal).toLocaleString("en-IN")]})})})}),e.jsxs("div",{className:"amount-in-words text-center",children:["Total in Words:"," ",t.amountInWords||T.numberToWords(t.grandTotal,"Intrastate").toUpperCase()]}),e.jsxs("div",{className:"note-signature-section",children:[e.jsxs("div",{className:"notes-area",children:[e.jsx("p",{className:"fw-bold mb-1 text-decoration-underline",children:"Notes:"}),e.jsxs("p",{className:"mb-1",children:[e.jsx("strong",{children:"Delivery:"})," within 1 to 3 weeks from the date of receipt of Purchase order"]}),e.jsxs("p",{className:"mb-1",children:[e.jsx("strong",{children:"Warranty:"})," As per Manufacturer"]}),e.jsxs("p",{className:"mb-0",children:[e.jsx("strong",{children:"Mode of Despatch:"})," Door Delivery"]})]}),e.jsxs("div",{className:"signature-area",children:[e.jsx("p",{className:"fw-bold mb-4",children:"Authorized Signature"}),e.jsx("p",{className:"small mb-0 mt-auto",children:"For WeberFox Technologies Pvt Ltd"})]})]})]})}),e.jsxs("div",{className:"d-flex justify-content-center align-items-center mt-4 mb-4 d-print-none footer-actions",children:[e.jsxs("button",{onClick:N,className:"btn btn-primary d-flex align-items-center me-2",children:[e.jsx("i",{className:"ti ti-printer me-2"})," Print Quotation"]}),e.jsxs("button",{onClick:x,className:"btn btn-secondary border d-flex align-items-center me-2",children:[e.jsx("i",{className:"ti ti-download me-2"})," Download PDF"]}),e.jsxs("button",{onClick:()=>j(o.quotationlist),className:"btn btn-outline-secondary d-flex align-items-center",children:[e.jsx("i",{className:"ti ti-arrow-left me-2"})," Back"]})]})]}),e.jsx(D,{})]})]}):e.jsx("div",{className:"page-wrapper",children:e.jsx("div",{className:"content",children:e.jsxs("div",{className:"text-center py-5",children:[e.jsx("h4",{children:"Quotation Not Found"}),e.jsx("p",{children:"The quotation you're looking for doesn't exist."}),e.jsx(h,{to:o.quotationlist,className:"btn btn-primary",children:"Back to Quotations"})]})})})};export{P as default};
