import{F as A,cn as T,r as d,j as e,L as D,a as L,ci as z,c as B,c3 as c}from"./index-Ddkxz7CW.js";import{I as m}from"./invoice.service-BLBchpdg.js";import{B as k}from"./bank.service-CDSGyTg6.js";const C=()=>{const u=L,{id:s}=A(),[r]=T(),[t,N]=d.useState(null),[a,g]=d.useState(null),[h,S]=d.useState(!0);d.useEffect(()=>{s&&Promise.all([m.getInvoiceById(s),k.getAllBankAccounts({status:!0}).catch(()=>({data:[]}))]).then(([i,n])=>{N(i.data??i);const l=n.data.find(o=>o.isDefault)||n.data[0];g(l)}).finally(()=>S(!1))},[s]);const y=()=>window.print(),j=async()=>{if(!(!s||!t))try{c.fire({title:"Generating PDF...",text:"Please wait",allowOutsideClick:!1,didOpen:()=>{c.showLoading()}}),await m.downloadInvoicePdf(s,t.invoiceNumber),c.close()}catch{c.fire({icon:"error",title:"Download Failed",text:"Could not download the invoice. Please try again."})}};if(d.useEffect(()=>{!t||h||r.get("download")==="true"&&j().then(()=>{r.get("close")==="true"&&setTimeout(()=>{window.parent!==window?console.log("Download complete inside iframe"):window.close()},2e3)})},[t,h,r]),h)return e.jsx("div",{className:"text-center py-5",children:"Loading..."});if(!t)return e.jsx("div",{className:"text-center py-5",children:"Invoice Not Found"});const p=t.notes?.match(/Converted from Quotation: (.*?) \(Dated: (.*?)\)/),w=p?.[1]||"—",v=p?.[2]||"—";return e.jsxs("div",{children:[e.jsx("style",{children:`

.invoice-doc{
max-width:950px;
margin:auto;
font-family:Arial, Helvetica, sans-serif;
color:#000;
}

.box-container{
border:1px solid #aaa;
margin-bottom:15px;
}

.invoice-table{
width:100%;
border-collapse:collapse;
font-size:11px;
}

.invoice-table th,
.invoice-table td{
border-left:1px solid #aaa;
border-right:1px solid #aaa;
border-top:none;
border-bottom:none;
padding:6px;
}

.invoice-table thead th{
border-top: 1px solid #aaa;
border-bottom: 1px solid #aaa;
}

.invoice-table tbody tr:last-child td{
/* prevent bottom gap */
}

.invoice-table th{
text-align:center;
font-weight:400;
background:#fff;
}

.invoice-table td{
vertical-align:middle;
}

.text-center{text-align:center}
.text-end{text-align:right}

.invoice-table td, 
.invoice-table th {
  white-space: normal;
  word-wrap: break-word;
}

/* Prevent wrapping for specific columns */
.invoice-table th:nth-child(1),
.invoice-table th:nth-child(3),
.invoice-table th:nth-child(4),
.invoice-table th:nth-child(5),
.invoice-table th:nth-child(6),
.invoice-table th:nth-child(7),
.invoice-table th:nth-child(8),
.invoice-table td:nth-child(1),
.invoice-table td:nth-child(3),
.invoice-table td:nth-child(4),
.invoice-table td:nth-child(5),
.invoice-table td:nth-child(6),
.invoice-table td:nth-child(7),
.invoice-table td:nth-child(8) {
  white-space: nowrap;
}

.bank-table td{
border:none;
padding:2px 0;
font-size:12px;
}

@media print{

.page-header,
.footer-actions,
.main-footer{
display:none !important;
}

.page-wrapper{
margin:0;
padding:0;
}

.invoice-doc{
width:100%;
}

}

`}),e.jsxs("div",{className:"page-wrapper",children:[e.jsxs("div",{className:"content",children:[e.jsxs("div",{className:"page-header d-print-none mb-4",children:[e.jsx("div",{className:"page-title",children:e.jsx("h4",{children:"Invoice View"})}),e.jsx(D,{to:u.invoicelist,className:"btn btn-primary",children:"Back"})]}),e.jsxs("div",{id:"invoice-content",className:"invoice-doc",children:[e.jsx("div",{className:"text-center fw-bold mb-2",style:{fontSize:"16px"},children:"Tax Invoice"}),e.jsx("div",{className:"box-container",children:e.jsxs("div",{className:"d-flex",children:[e.jsxs("div",{className:"col-6 border-end p-3",children:[e.jsx("div",{style:{fontSize:"12px",fontWeight:"bold"},children:"Invoice From:"}),e.jsx("div",{style:{fontWeight:"bold"},children:"WEBERFOX TECHNOLOGIES PVT LTD"}),e.jsx("div",{style:{fontSize:"12px"},children:"Building No:15/538, Koduvazhathu, Koivila P.O, Thevalakkara, Karunagappally, Kollam, Kerala PIN:691590"}),e.jsx("div",{style:{fontSize:"12px"},children:"GSTIN : 32AADCW0489R1ZQ"}),e.jsx("div",{style:{fontSize:"12px"},children:"State : Kerala (32)"}),e.jsx("div",{style:{fontSize:"12px"},children:"Email : contact@weberfox.com"}),e.jsx("div",{style:{fontSize:"12px"},children:"Contact : +91 94962 69666"}),e.jsx("hr",{}),e.jsx("div",{style:{fontWeight:"bold"},children:"Buyer (Bill To)"}),e.jsx("div",{style:{fontWeight:"bold"},children:t.customer?.name||t.customerName}),e.jsx("div",{style:{fontSize:"12px"},children:t.customerAddress}),e.jsxs("div",{style:{fontSize:"12px"},children:["GSTIN : ",t.customerGstin||"—"]})]}),e.jsxs("div",{className:"col-6",children:[e.jsxs("div",{className:"text-center border-bottom p-2",children:[e.jsx("img",{src:z,style:{height:"45px"}}),e.jsx("div",{style:{fontSize:"10px",fontWeight:"bold"},children:"AHEAD BY A WAVELENGTH"})]}),e.jsxs("div",{className:"d-flex border-bottom",children:[e.jsxs("div",{className:"col-7 border-end p-2",children:[e.jsx("div",{style:{fontSize:"12px"},children:"Invoice No"}),e.jsx("div",{style:{fontWeight:"bold"},children:t.invoiceNumber})]}),e.jsxs("div",{className:"col-5 text-center p-2",children:[e.jsx("div",{style:{fontSize:"12px"},children:"Dated"}),e.jsx("div",{className:"fw-bold",children:t.createdAt?new Date(t.createdAt).toLocaleDateString("en-GB"):t.invoiceDate?new Date(t.invoiceDate).toLocaleDateString("en-GB"):"—"})]})]}),e.jsxs("div",{className:"d-flex border-bottom",children:[e.jsxs("div",{className:"col-7 border-end p-2",children:[e.jsx("div",{style:{fontSize:"12px"},children:"Quote Ref"}),e.jsx("div",{style:{fontWeight:"bold"},children:w})]}),e.jsxs("div",{className:"col-5 text-center p-2",children:[e.jsx("div",{style:{fontSize:"12px"},children:"Dated"}),e.jsx("div",{className:"fw-bold",children:v!=="—"?new Date(v).toLocaleDateString("en-GB"):"—"})]})]}),e.jsxs("div",{className:"p-2",children:[e.jsx("div",{style:{fontSize:"12px"},children:"Place of Supply"}),e.jsx("div",{style:{fontWeight:"bold"},children:t.placeOfSupply||"KARNATAKA (29)"})]})]})]})}),e.jsxs("div",{className:"box-container",children:[e.jsxs("table",{className:"invoice-table",children:[e.jsxs("thead",{children:[e.jsxs("tr",{children:[e.jsx("th",{rowSpan:2,children:"Sl.No"}),e.jsx("th",{rowSpan:2,children:"Item & Description"}),e.jsx("th",{rowSpan:2,children:"HSN/SAC"}),e.jsx("th",{rowSpan:2,children:"Qty"}),e.jsx("th",{rowSpan:2,children:"Rate"}),e.jsx("th",{rowSpan:2,children:"Amount"}),e.jsx("th",{colSpan:2,children:"IGST"}),e.jsx("th",{rowSpan:2,children:"Total Amount (Inc GST)"})]}),e.jsxs("tr",{children:[e.jsx("th",{children:"%"}),e.jsx("th",{children:"Amt"})]})]}),e.jsxs("tbody",{children:[t.items.map((i,n)=>{const l=Number(i.quantity||i.qty)||0,o=Number(i.rate)||0,b=Number(i.taxPercent)||0,x=l*o,f=x*b/100,I=x+f;return e.jsxs("tr",{style:{height:"38px"},children:[e.jsx("td",{className:"text-center",children:n+1}),e.jsx("td",{children:i.productName}),e.jsx("td",{className:"text-center",children:i.hsnSac||"—"}),e.jsx("td",{className:"text-center",children:l}),e.jsx("td",{className:"text-end",children:o.toLocaleString("en-IN")}),e.jsx("td",{className:"text-end",children:x.toLocaleString("en-IN")}),e.jsx("td",{className:"text-center",children:b}),e.jsx("td",{className:"text-end",children:f.toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{className:"text-end",children:I.toLocaleString("en-IN",{minimumFractionDigits:2})})]},n)}),e.jsxs("tr",{style:{fontWeight:"bold",borderTop:"1px solid #aaa",borderBottom:"1px solid #aaa"},children:[e.jsx("td",{}),e.jsx("td",{className:"text-center",children:"TOTAL"}),e.jsx("td",{}),e.jsx("td",{className:"text-center",children:t.items.reduce((i,n)=>i+(Number(n.quantity||n.qty)||0),0)}),e.jsx("td",{}),e.jsx("td",{className:"text-end",children:t.subtotal.toLocaleString("en-IN")}),e.jsx("td",{}),e.jsx("td",{className:"text-end",children:t.taxAmount.toLocaleString("en-IN",{minimumFractionDigits:2})}),e.jsx("td",{className:"text-end",children:t.grandTotal.toLocaleString("en-IN",{minimumFractionDigits:2})})]})]})]}),e.jsxs("div",{style:{borderTop:"1px solid #aaa",padding:"10px",textAlign:"center",fontSize:"18px"},children:["Total Invoice Amount (Rounded off) :",e.jsxs("strong",{children:[" ","₹",Math.round(t.grandTotal).toLocaleString("en-IN")]})]})]}),e.jsxs("div",{className:"box-container",children:[e.jsxs("div",{className:"p-2 border-bottom",children:[e.jsx("div",{style:{fontSize:"12px"},children:"Amount Chargeable (in words)"}),e.jsxs("div",{style:{fontWeight:"bold"},children:["INR"," ",m.numberToWords(t.grandTotal,t.invoiceType).toUpperCase()]})]}),e.jsxs("div",{className:"d-flex",children:[e.jsxs("div",{className:"col-6 border-end p-3",children:[e.jsx("div",{style:{fontWeight:"bold"},children:"Remarks"}),e.jsx("div",{style:{fontSize:"12px"},children:t.notes||"Warranty: As per Manufacturer"})]}),e.jsxs("div",{className:"col-6",children:[e.jsxs("div",{className:"p-3 border-bottom",children:[e.jsx("div",{style:{fontWeight:"bold"},children:"Company's Bank Details"}),e.jsx("table",{className:"bank-table",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{width:"150",children:"A/c Holder"}),e.jsx("td",{children:":"}),e.jsx("td",{children:"WEBERFOX TECHNOLOGIES PVT LTD"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Bank Name"}),e.jsx("td",{children:":"}),e.jsx("td",{children:a?.bankName})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"A/c No"}),e.jsx("td",{children:":"}),e.jsx("td",{children:a?.accountNumber})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Branch & IFSC"}),e.jsx("td",{children:":"}),e.jsxs("td",{children:[a?.branch," & ",a?.ifsc]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"SWIFT"}),e.jsx("td",{children:":"}),e.jsx("td",{children:a?.swiftCode})]})]})})]}),e.jsxs("div",{className:"p-3 text-end",children:["for WEBERFOX TECHNOLOGIES PVT LTD",e.jsx("br",{}),e.jsx("br",{}),"Authorized Signatory"]})]})]})]})]}),e.jsxs("div",{className:"footer-actions text-center mt-4",children:[e.jsx("button",{onClick:y,className:"btn btn-primary me-2",children:"Print Invoice"}),e.jsx("button",{onClick:j,className:"btn btn-secondary me-2",children:"Download PDF"})]})]}),e.jsx(B,{})]})]})};export{C as default};
