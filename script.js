// credenciais escondidas
const ADMIN_NOME = atob("Q29vbGtpZA==");
const ADMIN_SENHA = atob("Y29vbGtpZDQ1Nl84");

function entrarVisitante(){
 localStorage.tipo = "visitante";
 window.location = "posts.html";
}

function irAdmin(){
 window.location = "admin.html";
}

function loginAdmin(){
 if(nome.value==ADMIN_NOME && senha.value==ADMIN_SENHA){
   localStorage.tipo = "admin";
   window.location = "posts.html";
 } else alert("Erro");
}

function logout(){
 localStorage.removeItem("tipo");
 window.location = "inicio.html";
}

function verificar(){
 if(!localStorage.tipo) window.location="inicio.html";
 if(localStorage.tipo=="admin"){
   document.getElementById("adminArea").classList.remove("hidden");
 }
 carregar();
}

function adicionar(){
 let lista=JSON.parse(localStorage.lista||"[]");
 lista.push({nome:nomeApp.value,link:linkApp.value});
 localStorage.lista=JSON.stringify(lista);
 carregar();
}

function deletar(i){
 let lista=JSON.parse(localStorage.lista);
 lista.splice(i,1);
 localStorage.lista=JSON.stringify(lista);
 carregar();
}

function carregar(){
 let lista=JSON.parse(localStorage.lista||"[]");
 let div=document.getElementById("lista");
 let filtro=document.getElementById("pesquisa").value.toLowerCase();

 div.innerHTML="";

 lista.forEach((item,i)=>{
 if(filtro && !item.nome.toLowerCase().includes(filtro)) return;

 div.innerHTML+=`
 <div class='card'>
   <h3>${item.nome}</h3>
   <a href='${item.link}' target='_blank'>
     <button>Baixar 📱</button>
   </a>
   ${localStorage.tipo=="admin" ? `<button onclick='deletar(${i})'>🗑️</button>` : ""}
 </div>
 `;
 });
}
