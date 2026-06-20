from flask import Flask, request, jsonify
from supabase import create_client
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import time
import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.route("/")
def home():
    try:
        data = supabase.table("complaints").select("*").execute()
        return f"Supabase Connected Successfully! Records Found: {len(data.data)}"
    except Exception as e:
        return f"Connection Error: {str(e)}"


@app.route("/submit-complaint", methods=["POST"])
def submit_complaint():

    try:

        complaint_id = "CC" + str(int(time.time()))

        full_name = request.form["full_name"]
        mobile = request.form["mobile"]
        village = request.form["village"].strip()
        category = request.form["category"]
        description = request.form["description"]
        image = request.files["image"]

        filename = secure_filename(
        complaint_id + "_" + image.filename
        )

        file_bytes = image.read()

        supabase.storage.from_("complaint-image").upload(
        filename,
        file_bytes
        )

        image_url = supabase.storage.from_("complaint-image").get_public_url(
        filename
        )

        complaint = {
        "complaint_id": complaint_id,
        "full_name": full_name,
        "mobile": mobile,
        "village": village,
        "category": category,
        "description": description,
        "status": "Pending",
        "image_url": image_url
        }

        supabase.table("complaints").insert(complaint).execute()

        return jsonify({
        "success": True,
        "complaint_id": complaint_id
    })

    except Exception as e:
        print("ERROR:",str(e))
        return jsonify({
        "success": False,
        "error": str(e)
        })
@app.route("/area-complaints", methods=["GET"])
def area_complaints():

    try:
        data = supabase.table("complaints").select("village").execute()

        areas = {}

        for item in data.data:
            village = item["village"]

            if village in areas:
                areas[village] += 1
            else:
                areas[village] = 1

        result = [
            {"village": v, "count": c}
            for v, c in areas.items()
        ]

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})
@app.route("/all-complaints", methods=["GET"])
def all_complaints():

    try:

        data = supabase.table("complaints") \
            .select("*") \
            .execute()

        return jsonify(data.data)

    except Exception as e:

        return jsonify({"error": str(e)})    
@app.route("/complaints-by-village/<village>", methods=["GET"])
def complaints_by_village(village):

    try:

        data = supabase.table("complaints") \
            .select("*") \
            .execute()

        result = []

        for item in data.data:

            db_village = item["village"]

            if db_village.strip().lower() == village.strip().lower():
                result.append(item)

        return jsonify(result)

    except Exception as e:

        return jsonify({"error": str(e)})
@app.route("/update-status/<complaint_id>", methods=["PUT"])
def update_complaint_status(complaint_id):

    try:

        supabase.table("complaints") \
            .update({"status": "Resolved"}) \
            .eq("complaint_id", complaint_id) \
            .execute()

        return jsonify({
            "success": True
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })    
@app.route("/update-status/<complaint_id>", methods=["PUT"])
def update_status(complaint_id):

    try:

        supabase.table("complaints") \
            .update({"status": "Resolved"}) \
            .eq("complaint_id", complaint_id) \
            .execute()

        return jsonify({"success": True})

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })    
@app.route("/stats", methods=["GET"])
def get_stats():

    try:

        data = supabase.table("complaints").select("*").execute()

        total = len(data.data)

        pending = len([
            x for x in data.data
            if x["status"] == "Pending"
        ])

        resolved = len([
            x for x in data.data
            if x["status"] == "Resolved"
        ])

        return jsonify({
            "total": total,
            "pending": pending,
            "resolved": resolved,
            "progress": 0
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        })  
@app.route("/dashboard-data", methods=["GET"])
def dashboard_data():

    try:

        data = supabase.table("complaints").select("*").execute()
        complaints = data.data or []

        total = len(complaints)

        resolved = len([x for x in complaints if x.get("status") == "Resolved"])
        pending = len([x for x in complaints if x.get("status") == "Pending"])

        villages = len(set(x.get("village") for x in complaints))

        resolution_rate = int((resolved / total) * 100) if total > 0 else 0

        # FIX: use simple reverse insert logic instead of sorting complaint_id
        recent = complaints[::-1][:3]

        return jsonify({
            "total": total,
            "pending": pending,
            "resolved": resolved,
            "villages": villages,
            "resolution_rate": resolution_rate,
            "recent": recent,
            "last_updated": "Now"
        })

    except Exception as e:
        return jsonify({"error": str(e)})
@app.route("/reports-data", methods=["GET"])
def reports_data():

    try:

        data = supabase.table("complaints").select("*").execute()
        complaints = data.data or []

        categories = {}
        status = {"Pending": 0, "Resolved": 0, "In Progress": 0}
        category_summary = {}

        for c in complaints:

            # chart category
            cat = c.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + 1

            # status
            st = c.get("status", "Pending")
            if st in status:
                status[st] += 1

            # REPORT SUMMARY (IMPORTANT)
            category_summary[cat] = category_summary.get(cat, 0) + 1

        recent = complaints[::-1][:3]

        return jsonify({
            "categories": categories,
            "status": status,
            "category_summary": category_summary,
            "recent": recent
        })

    except Exception as e:
        return jsonify({"error": str(e)})
import pandas as pd
from flask import send_file

@app.route("/download-excel", methods=["GET"])
def download_excel():

    try:
        data = supabase.table("complaints").select("*").execute()
        complaints = data.data or []

        df = pd.DataFrame(complaints)

        file_name = "complaints_report.xlsx"
        df.to_excel(file_name, index=False)

        return send_file(file_name, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)})
@app.route("/track-complaint/<complaint_id>", methods=["GET"])
def track_complaint(complaint_id):

    try:
        data = supabase.table("complaints") \
            .select("*") \
            .eq("complaint_id", complaint_id) \
            .execute()

        if len(data.data) == 0:
            return jsonify({"error": "Complaint not found"})

        return jsonify(data.data[0])

    except Exception as e:
        return jsonify({"error": str(e)})    
@app.route("/debug-villages")
def debug_villages():

    data = supabase.table("complaints").select("village").execute()

    return jsonify(data.data)    
if __name__ == "__main__":
    app.run(debug=True)