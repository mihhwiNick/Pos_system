let allProducts = [];
let filteredProducts = [];
let dsTieuDe = [];

// lay sp
async function fetchProducts() {
  try {
    let response = await fetch("http://127.0.0.1:5001/products");
    allProducts = await response.json();

    filteredProducts = allProducts;
    displayProducts(allProducts);
    dsTieuDe = Object.keys(allProducts[0]);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
  }
}
// update sp
async function updateProduct(product) {
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

  const result = await response.json();
  console.log(result.message);
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
function displayProducts(ds) {
  if (ds == null) return;
  let tbody = document.getElementById("product_table");
  tbody.innerHTML = "";

  ds.forEach((prd) => {
    let row = `
            <tr>
                <td>${prd.name}</td>
                <td>${prd.brand}</td>
                <td>${prd.price}</td>
                <td>${prd.stock}</td>
                <td>${prd.image_url}</td>
                <td>
                    <button onclick="chon(${prd.id})">chon</button>
                    <button onclick="deleteSP(${prd.id})">xoa</button>
                </td>
            </tr>
            `;
    tbody.innerHTML += row;
  });
}
// hien sp a len input de xem chi tiet
function chon(a) {
  allProducts.forEach((prd) => {
    if (prd.id == a) {
      updateInput(prd);
    }
  });
}
//sua du lieu trong mang allProducts
function updateDuLieuTrongBang() {
  let id = document.getElementById("id").value;
  allProducts.forEach((prd) => {
    if (id == prd.id) {
      for (let i = 0; i < dsTieuDe.length; i++) {
        if (dsTieuDe[i] == "image_url") continue;
        prd[dsTieuDe[i]] = document.getElementById(dsTieuDe[i]).value;
      }
      console.log(prd);

      updateProduct(prd);
    }
  });
  displayProducts(filteredProducts);
}
function deleteSPKoThamSo() {
  deleteSP(document.getElementById("id").value);
}
function deleteSP(id) {
  console.log(id);
  deleteProduct(id);

  for (let i = 0; i < allProducts.length; i++) {
    if (id == allProducts[i].id) {
      console.log(allProducts[i]);

      allProducts.splice(i, 1);
      updateInput(initSP());
    }
  }
  displayProducts(filteredProducts);
}
//sua thong tin tren the input
function updateInput(prd) {
  for (let i = 0; i < dsTieuDe.length; i++) {
    if (dsTieuDe[i] == "image_url") continue;
    document.getElementById(dsTieuDe[i]).value = prd[dsTieuDe[i]];
  }
}
//tao sp moi
function initSP() {
  let a = {};
  for (let i = 0; i < dsTieuDe.length; i++) {
    a[dsTieuDe[i]] = "";
  }
  return a;
}

function xemchitiet() {
  let a = document.getElementById("thong_tin_chi_tiet").style;
  if (a.display == "block") {
    a.display = "none";
  } else {
    a.display = "block";
  }
}

function timkiem() {
  let thongtin = document.getElementById("input_tim_kiem").value;
  let thuoctinh = document.getElementById("select_tim_kiem").value;
  filteredProducts = [];
  allProducts.forEach((prd) => {
    if (prd[thuoctinh].toLowerCase().includes(thongtin.toLowerCase())) {
      console.log(prd);

      filteredProducts.push(prd);
    }
    displayProducts(filteredProducts);
  });
}

function taoInputTrong() {
  updateInput(initSP());
  document.getElementById("id").value = "tu dong cat nhat";
  document.getElementById("themVaHuy").style.display = "block";
}
async function themSP() {
  let a = initSP();
  for (let i = 0; i < dsTieuDe.length; i++) {
    if (dsTieuDe[i] == "image_url") continue;
    a[dsTieuDe[i]] = document.getElementById(dsTieuDe[i]).value;
  }
  a.id = -1;
  
  let fileInput = document.getElementById("image_url");
  if (fileInput.files.length > 0) {
    console.log("Tên file:", fileInput.files[0].name);
    a.image_url="img/products/"+fileInput.files[0].name;
  } else {
    a.image_url = "img/products/1.jpg";
  }

  addProduct(a);

  let latestProduct = await getLatestProduct();
  console.log(latestProduct);

  allProducts.push(latestProduct);
  console.log("them thanh cong");
  console.log(allProducts[allProducts.length - 1]);

  updateInput(allProducts[allProducts.length - 1]);
  console.log(a);

  huythem();
  displayProducts(allProducts);
}
function huythem() {
  document.getElementById("themVaHuy").style.display = "none";
}

window.onload = fetchProducts();
