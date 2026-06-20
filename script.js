document.addEventListener("DOMContentLoaded", function(){

    // Complaint Form

    const form = document.getElementById("complaintForm");

    if(form){

       form.addEventListener("submit", async function(e){

    e.preventDefault();

    const name = document.getElementById("fullName").value;
    const mobile = document.getElementById("mobile").value;
    const village = document.getElementById("village").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const image = document.getElementById("complaintImage").files[0];

    if(!/^[0-9]{10}$/.test(mobile)){
        alert("Please enter a valid 10-digit mobile number");
        return;
    }

    try{

    const formData = new FormData();

    formData.append("full_name", name);
    formData.append("mobile", mobile);
    formData.append("village", village);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("image", image);

    const response = await fetch(
        "https://civicconnect-xred.onrender.com/submit-complaint",
        {
            method: "POST",
            body: formData
        }
    );

    const result = await response.json();

    if(result.success){

        document.getElementById("receiptId").textContent =
            result.complaint_id;

        document.getElementById("receiptName").textContent = name;
        document.getElementById("receiptVillage").textContent = village;
        document.getElementById("receiptCategory").textContent = category;

        form.style.display = "none";
        document.getElementById("receipt").style.display = "block";

    }else{

        alert("Error: " + result.error);

    }

}catch(error){

    alert("Unable to connect to backend");

    console.log(error);

}
});

    }

    // Admin Login

    const loginForm = document.getElementById("adminLoginForm");

    if(loginForm){

        loginForm.addEventListener("submit", function(e){

            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            if(username === "admin" && password === "admin123"){

                window.location.href = "dashboard.html";

            }else{

                alert("Invalid Username or Password");

            }

        });

    }

});
async function loadAreas() {

    
    try {

        const res = await fetch("https://civicconnect-xred.onrender.com/area-complaints");

       

        const data = await res.json();

        

        const container = document.getElementById("areaContainer");

        container.innerHTML = "";

        data.forEach(area => {

            const card = document.createElement("div");

            card.className = "area-card";

            card.innerHTML = `
                <h3>📍 ${area.village}</h3>
                <p>Total Complaints: ${area.count}</p>
                <button onclick="goToComplaints('${area.village}')">
                    View Complaints
                </button>
            `;

            container.appendChild(card);
        });

    } catch (err) {

       

        console.log(err);
    }
}

async function loadComplaints() {

    const params = new URLSearchParams(window.location.search);
    const village = params.get("village");
    alert("Village = " + village);

   let url;

if(village){

    url = "https://civicconnect-xred.onrender.com/complaints-by-village/" + village;

}else{

    url = "https://civicconnect-xred.onrender.com/all-complaints";

}
    const res = await fetch(url);
    const data = await res.json();
    alert("Village = " + village);
alert("Records Found = " + data.length);
console.log(data);

    const container = document.getElementById("complaintsContainer");
    const title = document.getElementById("pageTitle");

    container.innerHTML = "";

    if(village){
        title.innerText = "📋 Complaints - " + village;
    }

    data.forEach(item => {

       const row = document.createElement("tr");

row.innerHTML = `
    <td>${item.complaint_id}</td>
    <td>${item.full_name}</td>
    <td>${item.village}</td>
    <td>${item.category}</td>

    <td>
        <span class="${item.status === 'Pending' ? 'status-pending' : 'status-resolved'}">
            ${item.status}
        </span>
    </td>

    <td>
        ${item.image_url
            ? `<a href="${item.image_url}" target="_blank">View Image</a>`
            : "No Image"}
    </td>

    <td>
        <button onclick="markResolved('${item.complaint_id}')">
            Resolve
        </button>
    </td>
`;

document.getElementById("complaintsContainer").appendChild(row);
    });
}

const complaintsContainer = document.getElementById("complaintsContainer");

if(complaintsContainer){
    loadComplaints();
}
const areaContainer = document.getElementById("areaContainer");

if(areaContainer){
    loadAreas();
}
function goToComplaints(village) {
    window.location.href = "complaints.html?village=" + encodeURIComponent(village);
}
async function markResolved(complaintId){

    const res = await fetch(
        "https://civicconnect-xred.onrender.com/update-status/" + complaintId,
        {
            method: "PUT"
        }
    );

    const data = await res.json();

    if(data.success){

        alert("Complaint Resolved");

        location.reload();

    }else{

        alert("Failed to update status");

    }
}
async function loadStats(){

    const res = await fetch(
        "https://civicconnect-xred.onrender.com/stats"
    );

    const data = await res.json();

    const total = document.getElementById("totalCount");
    const pending = document.getElementById("pendingCount");
    const progress = document.getElementById("progressCount");
    const resolved = document.getElementById("resolvedCount");

    if(total) total.textContent = data.total;
    if(pending) pending.textContent = data.pending;
    if(progress) progress.textContent = data.progress;
    if(resolved) resolved.textContent = data.resolved;
}
if(document.getElementById("totalCount")){
    loadStats();
}
function searchComplaint(){

    const value = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    const rows = document.querySelectorAll(".complaint-card");

    rows.forEach(row => {

        const text = row.innerText.toLowerCase();

        if(text.includes(value)){
            row.style.display = "block";
        }else{
            row.style.display = "none";
        }

    });
}
async function loadDashboardData(){

    const res = await fetch(
        "https://civicconnect-xred.onrender.com/dashboard-data"
    );

    const data = await res.json();

    const villages = document.getElementById("villagesCovered");
    const users = document.getElementById("activeUsers");
    const rate = document.getElementById("resolutionRate");

    if(villages){
        villages.textContent =
            "📍 Villages Covered: " + data.villages;
    }

    if(users){
        users.textContent =
            "👥 Total Complaints: " + data.total;
    }

    if(rate){
        rate.textContent =
            "⚡ Resolution Rate: " +
            data.resolution_rate + "%";
    }

    const body =
        document.getElementById(
            "recentComplaintsBody"
        );

    if(body){

        body.innerHTML = "";

        data.recent.forEach(item => {

            body.innerHTML += `
            <tr>
                <td>${item.complaint_id}</td>
                <td>${item.category}</td>
                <td>${item.village}</td>
                <td>${item.status}</td>
            </tr>
            `;
        });
    }

    const lastUpdated =
        document.getElementById(
            "lastUpdated"
        );

    if(lastUpdated){

        lastUpdated.textContent =
            "Last Updated: " +
            new Date().toLocaleString();
    }
}
if(document.getElementById("recentComplaintsBody")){
    loadDashboardData();
}
function downloadExcel(){
    window.open("http:///download-excel");
}
async function trackComplaint(){

    const id = document.getElementById("trackId").value;

    const res = await fetch(`https://civicconnect-xred.onrender.com/track-complaint/${id}`);
    const data = await res.json();

    const container = document.getElementById("trackResult");

    if(data.error){
        container.innerHTML = `<p style="color:red">${data.error}</p>`;
        return;
    }

    container.innerHTML = `
        <div class="track-card">
            <h3>${data.complaint_id}</h3>
            <p><b>Name:</b> ${data.full_name}</p>
            <p><b>Village:</b> ${data.village}</p>
            <p><b>Category:</b> ${data.category}</p>
            <p><b>Status:</b> ${data.status}</p>
            <p><b>Description:</b> ${data.description}</p>
            <img src="${data.image_url}" width="200"/>
        </div>
    `;
}
async function loadHomeStats() {

    const res = await fetch(
        "https://civicconnect-xred.onrender.com/stats"
    );

    const data = await res.json();
    console.log("Village:", village);
    console.log("Data:", data);

    const total = document.getElementById("totalComplaints");
    const pending = document.getElementById("pendingComplaints");
    const resolved = document.getElementById("resolvedComplaints");

    if(total) total.textContent = data.total;
    if(pending) pending.textContent = data.pending;
    if(resolved) resolved.textContent = data.resolved;
}

if(document.getElementById("totalComplaints")){
    loadHomeStats();
}