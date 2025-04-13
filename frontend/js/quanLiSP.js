let allProducts = [];
let filteredProducts = [];
let dsTieuDe = [];
let currentProduct = {};
let currentPage = 0;
// lay sp
async function fetchProducts() {
  try {
    let response = await fetch("http://127.0.0.1:5001/products");
    allProducts = await response.json();
    filteredProducts = allProducts;
    displayProducts();
    dsTieuDe = Object.keys(allProducts[0]);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
  }
}

// update sp
async function updateProduct(product) {
  product["image_url"] = product["image_url"].split("frontend/")[1];
  const response = await fetch(
    `http://127.0.0.1:5001/quanLiSP/update/${product.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    }
  );

  const result = await response.json();
  console.log(result.message);
}

// them sp
async function addProduct(product) {
  const response = await fetch(`http://127.0.0.1:5001/quanLiSP/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (response.ok) {
    const result = await response.json();
    console.log("Thêm thành công:", result.message);
    const newProductId = result.id; // Giả sử API trả về id của sản phẩm mới
    console.log("ID của sản phẩm mới:", newProductId);
    return newProductId;
  } else {
    const error = await response.json();
    console.error("Lỗi thêm sản phẩm:", error.message);
    return null;
  }
}

// xoa sp
async function deleteProduct(productId) {
  const response = await fetch(
    `http://127.0.0.1:5001/quanLiSP/delete/${productId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json();
  console.log(result.message);
}

// lay sp vua moi them vao tren database
async function getLatestProduct() {
  try {
    const response = await fetch(
      "http://127.0.0.1:5001/quanLiSP/latest_product"
    );
    const data = await response.json();

    if (data.id) {
      console.log("Sản phẩm mới nhất:", data);
      return data; // Trả về sản phẩm mới nhất
    } else {
      console.log("Không có sản phẩm nào.");
      return null;
    }
  } catch (error) {
    console.error("Lỗi:", error);
    return null;
  }
}

//hien ds sp
function displayProducts() {
  if (filteredProducts == null) return;
  let tbody = document.getElementById("product_table");
  tbody.innerHTML = "";

  // filteredProducts.forEach((prd) => {
  //   let row = `
  //           <tr>
  //               <td>${prd.name}</td>
  //               <td>${prd.brand}</td>
  //               <td>${prd.price}</td>
  //               <td>${prd.stock}</td>
  //               <td>${prd.image_url}</td>
  //               <td>
  //                   <button onclick="chon(${prd.id})">chon</button>
  //                   <button onclick="deleteSP(${prd.id})">xoa</button>
  //               </td>
  //           </tr>
  //           `;
  //   tbody.innerHTML += row;
  // });
  let count = currentPage * 10;
  for (let i = count; i < count + 10; i++) {
    let row = ``;
    if (filteredProducts[i]) {
      prd = filteredProducts[i];
      row = `
            <tr>
                <td>${prd.name}</td>
                <td>${prd.brand}</td>
                <td>${prd.price}</td>
                <td>${prd.image_url}</td>
                <td>
                    <button onclick="sua(${prd.id})" class="xoasua">
                      <img src="../img/edit.png" alt="">
                    </button>
                    <button onclick="deleteSP(${prd.id})" class="xoasua">
                      <img src="../img/delete.png" alt="">
                    </button>
                    <button onclick="chon(${prd.id})" class="xoasua">chi tiet
                    </button>
                </td>
            </tr>
            `;
    } else {
      row = `
      <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
      </tr>`;
    }
    tbody.innerHTML += row;
  }
  document.getElementById("trang_hien_tai").innerHTML = currentPage;
}
//phan trang
function trangSau() {
  const tt = document.getElementById("trang_truoc");
  const ts = document.getElementById("trang_sau");
  const tht = document.getElementById("trang_hien_tai");
  currentPage++;
  tht.innerHTML = currentPage;
  const soTrang = filteredProducts.length / 10;
  console.log(soTrang);

  if (soTrang < currentPage + 1) {
    ts.style.display = "none";
  }
  if (currentPage > 0) {
    tt.style.display = "block";
  }
  displayProducts();
}
function trangTruoc() {
  const tt = document.getElementById("trang_truoc");
  const ts = document.getElementById("trang_sau");
  const tht = document.getElementById("trang_hien_tai");
  currentPage--;
  tht.innerHTML = currentPage;
  if (currentPage == 0) {
    tt.style.display = "none";
  }
  if (ts.style.display == "none") {
    ts.style.display = "block";
  }
  displayProducts();
}
// hien sp a len input de xem chi tiet
function chon(a) {
  allProducts.forEach((prd) => {
    if (prd.id == a) {
      document.getElementById("thong_tin_sp").style.display = "block";
      updateInput(prd);
      currentProduct = prd;
    }
  });
}
//
function sua(a){
  chon(a);
  document.getElementById("sua_thong_tin").style.display="block";
}
//sua du lieu trong mang allProducts
function updateDuLieuTrongBang() {
  let id = currentProduct["id"];
  allProducts.forEach((prd) => {
    if (id == prd.id) {
      for (let i = 0; i < dsTieuDe.length; i++) {
        if (dsTieuDe[i] == "id" || dsTieuDe[i] == "stock") continue;
        prd[dsTieuDe[i]] = document.getElementById(dsTieuDe[i]).value;
      }
      let testprd = { ...prd };
      updateProduct(testprd);
    }
  });
  displayProducts();
}

//xoa
function deleteSPKoThamSo() {
  deleteSP(currentProduct["id"]);
  currentProduct = {};
}
function deleteSP(id) {
  if (confirm("co muon xoa sp ko")) {
    deleteProduct(id);
    for (let i = 0; i < allProducts.length; i++) {
      if (id == allProducts[i].id) {
        allProducts.splice(i, 1);
        updateInput(initSP());
        break;
      }
    }
    displayProducts();
  }
}

//sua thong tin tren the input
function updateInput(prd) {
  for (let i = 0; i < dsTieuDe.length; i++) {
    if (dsTieuDe[i] == "id" || dsTieuDe[i] == "stock") continue;
    document.getElementById(dsTieuDe[i]).value = prd[dsTieuDe[i]];
  }
}
//tao sp moi
function initSP() {
  let a = {};
  for (let i = 0; i < dsTieuDe.length; i++) {
    if (dsTieuDe[i] == "id") continue;
    a[dsTieuDe[i]] = "";
  }
  a["stock"] = 0;
  return a;
}
//xem them cac thong tin cua sp
function xemchitiet() {
  let a = document.getElementById("thong_tin_chi_tiet").style;
  if (a.display == "block") {
    a.display = "none";
  } else {
    a.display = "block";
  }
}

//tiem kiem
function timkiem() {
  let thongtin = document.getElementById("input_tim_kiem").value; //lay thong tin can tim
  let thuoctinh = document.getElementById("select_tim_kiem").value; //lay thuoc tinh cua thong tin
  currentPage = 0;
  //tao ds rong
  filteredProducts = [];
  allProducts.forEach((prd) => {
    if (prd[thuoctinh].toLowerCase().includes(thongtin.toLowerCase())) {
      //them sp vao danh sach vua tao
      filteredProducts.push(prd);
    }
    //hien ds vua tao len table
    displayProducts();
  });
}
document.getElementById("input_tim_kiem").addEventListener("input", timkiem);
//vao che do them sp va tao input trong
function taoInputTrong() {
  document.getElementById("thong_tin_sp").style.display = "block";
  updateInput(initSP());
  document.getElementById("themVaHuy").style.display = "block";
}
async function themSP() {
  let a = initSP();
  for (let i = 0; i < dsTieuDe.length; i++) {
    if (dsTieuDe[i] == "id" || dsTieuDe[i] == "stock") continue;
    a[dsTieuDe[i]] = document.getElementById(dsTieuDe[i]).value;
  }
  a.id = -1;
  //them sp vao database
  addProduct(a);
  //lay id sp vua vao database
  a.image_url = "http://127.0.0.1:5500/frontend/" + a.image_url;
  a.id = await getLatestProduct();
  //them sp moi vao ds san pham
  allProducts.push(a);
  //hien sp moi len input de theo doi
  updateInput(allProducts[allProducts.length - 1]);
  //thoat khoi che do them
  huythem();
  //hien sp len table
  displayProducts();
  //tat input
  document.getElementById("thong_tin_sp").style.display = "none";
}
document
  .getElementById("file_image_url")
  .addEventListener("change", function (e) {
    const file = e.target;
    let url_image = "img/products/" + file.files[0].name;
    document.getElementById("image_url").value = url_image;
  });

//thoat che do them
function huythem() {
  document.getElementById("themVaHuy").style.display = "none";
  document.getElementById("themsuaxoa").style.display = "block";
  document.getElementById("thong_tin_sp").style.display = "none";
}

//tat thong tin chi tiet
function tatThongTinChiTiet(){
  document.getElementById("thong_tin_sp").style.display="none";
  document.getElementById("themVaHuy").style.display = "none";
  document.getElementById("sua_thong_tin").style.display="none";
}

window.onload = fetchProducts();

window.logout = function () {
  sessionStorage.removeItem("loginData");
  window.location.href = "app.html";
};