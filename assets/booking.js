const form=document.querySelector("#booking"), visit=document.querySelector("#visit"), save=document.querySelector("#save");
const today=new Date();
form.elements.date.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
form.oninput=()=>{save.hidden=true;visit.textContent="Your details changed. Prepare the request to review it.";};
form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);visit.textContent=["Lux Tube Beauty Parlour","Appointment enquiry for "+f.get("guest").trim(),f.get("service"),f.get("date")+" · "+f.get("time"),"Status: demo request, awaiting parlour confirmation."].join("\n");save.hidden=false;save.focus();};
save.onclick=()=>{const url=URL.createObjectURL(new Blob([visit.textContent],{type:"text/plain"}));const a=document.createElement("a");a.href=url;a.download="lux-tube-request.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
