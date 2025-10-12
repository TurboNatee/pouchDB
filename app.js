const db = new PouchDB('missions_db');
const remoteDB = new PouchDB('http://admin:mtu12345@127.0.0.1:5984/advanceddb_project');

const missionsList = document.getElementById('missionsList');
const nameInput = document.getElementById('name');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('addBtn');

let editingId = null; 

async function loadMissions() {
  missionsList.innerHTML = '';
  try {
    const res = await db.allDocs({ include_docs: true, limit: 10, descending: true });

    res.rows.forEach((row, index) => {
      const li = document.createElement('li');

      const name = row.doc["Flight Number"] || "Unknown Mission";
      const date = row.doc["Launch Date"] || "Unknown Date";

      if (editingId === row.doc._id) {
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

          await db.put({ 
            ...row.doc, 
            "Flight Number": newName, 
            "Launch Date": newDate 
          });
          editingId = null;
          loadMissions();
        };

        li.querySelector('.cancel-btn').onclick = () => {
          editingId = null;
          loadMissions();
        };

      } else {
        li.innerHTML = `
          <span>${index + 1}. <strong>${name}</strong> — <em>${date}</em></span>
          <div>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </div>
        `;
        li.querySelector('.edit-btn').onclick = () => {
          editingId = row.doc._id;
          loadMissions();
        };
        li.querySelector('.delete-btn').onclick = async () => {
          await db.remove(row.doc);
          loadMissions();
        };
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

  await db.put({
    _id: new Date().toISOString(),
    "Flight Number": name,
    "Launch Date": date
  });

  nameInput.value = '';
  dateInput.value = '';
  loadMissions();
};

loadMissions();

db.sync(remoteDB, { live: true, retry: true })
  .on('change', info => {
    console.log('Replication change:', info);
    loadMissions(); 
  })
  .on('error', err => console.error('Replication error:', err));
