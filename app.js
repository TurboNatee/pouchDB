const db = new PouchDB('missions_db');
const remoteDB = new PouchDB('http://admin:mtu12345@127.0.0.1:5984/advanceddb_project');
const remoteDB2 = new PouchDB('http://localhost:3000/advanceddb_project');




const missionsList = document.getElementById('missionsList');
const nameInput = document.getElementById('name');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('addBtn');

let editingId = null;
let missionsCache = new Set();

function parseDate(str) {
  if (!str) return new Date(0);
  let d = new Date(str);
  if (!isNaN(d)) return d;

  const parts = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (parts) {
    const day = parseInt(parts[1]);
    const month = new Date(`${parts[2]} 1, 2000`).getMonth();
    const year = parseInt(parts[3]);
    return new Date(year, month, day);
  }

  return new Date(0);
}

async function loadMissions() {
  missionsList.innerHTML = '';
  missionsCache.clear();

  try {
    const res = await db.allDocs({ include_docs: true });
    let missions = res.rows.map(r => r.doc);

    missions.sort((a, b) => parseDate(b["Launch Date"]) - parseDate(a["Launch Date"]));
    missions = missions.slice(0, 10);

    missions.forEach((doc, index) => {
      if (missionsCache.has(doc._id)) return;
      missionsCache.add(doc._id);

      const li = document.createElement('li');
      const name = doc["Flight Number"] || "Unknown Mission";
      const date = doc["Launch Date"] || "Unknown Date";

      if (editingId === doc._id) {
        li.innerHTML = `
          <input type="text" id="editName" value="${name}" />
          <input type="text" id="editDate" value="${date}" />
          <button class="save-btn">Save</button>
          <button class="cancel-btn">Cancel</button>
        `;
        li.querySelector('.save-btn').onclick = async () => {
          const newName = li.querySelector('#editName').value.trim();
          const newDate = li.querySelector('#editDate').value.trim();
          if (!newName || !newDate) return;
          await db.put({ ...doc, "Flight Number": newName, "Launch Date": newDate });
          editingId = null;
          loadMissions();
        };
        li.querySelector('.cancel-btn').onclick = () => { editingId = null; loadMissions(); };
      } else {
        li.innerHTML = `
          <span>${index + 1}. <strong>${name}</strong> — <em>${date}</em></span>
          <div>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </div>
        `;
        li.querySelector('.edit-btn').onclick = () => { editingId = doc._id; loadMissions(); };
        li.querySelector('.delete-btn').onclick = async () => { await db.remove(doc); loadMissions(); };
      }

      missionsList.appendChild(li);
    });

  } catch (err) {
    console.error('Error loading missions:', err);
  }
}

addBtn.onclick = async () => {
  const name = nameInput.value.trim();
  const date = dateInput.value.trim();
  if (!name || !date) return;

  await db.put({ _id: new Date().toISOString(), "Flight Number": name, "Launch Date": date });
  nameInput.value = '';
  dateInput.value = '';
};

loadMissions();

db.sync(remoteDB, { live: true, retry: true })
  .on('change', () => loadMissions())
  .on('error', err => console.error('Replication error:', err));

db.sync(remoteDB2, { live: true, retry: true })
  .on('change', () => loadMissions())
  .on('error', err => console.error('Replication error:', err));
