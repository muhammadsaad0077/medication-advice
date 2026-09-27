
// ---- Mock data ----
const formulary = [
  { name: "Amoxicillin", min: 250, max: 1000, unit: "mg" },
  { name: "Amlodipine", min: 5, max: 10, unit: "mg" },
  { name: "Atorvastatin", min: 10, max: 80, unit: "mg" },
  { name: "Ibuprofen", min: 200, max: 800, unit: "mg" },
  { name: "Insulin", min: 1, max: 50, unit: "units" },
  { name: "Metformin", min: 500, max: 2000, unit: "mg" },
  { name: "Paracetamol", min: 500, max: 1000, unit: "mg" },
  { name: "Warfarin", min: 1, max: 10, unit: "mg" }
];

const currentMedication = { name: "Metformin", dose: 500, unit: "mg" };

let audit = [];
let pending = null; // { drug, dose, source }

// ---- Helpers ----
function $(id){ return document.getElementById(id); }
function show(id){ $(id).classList.remove('hidden'); }
function hide(id){ $(id).classList.add('hidden'); }

function resetAllSteps(){
  ['step-current','step-new','step-formulary','rangeWarning','rangeChangeWrap','step-check','step-done']
    .forEach(hide);
  ['currentDoseInputWrap','newDrugResults','newDrugConfirmWrap','newDoseWrap',
   'formResults','formConfirmWrap','formDoseWrap']
    .forEach(hide);
  $('medField').value = "";
  $('newDrugSearch').value = "";
  $('formSearch').value = "";
  show('step-start');
}

function findDrug(name){
  return formulary.find(d => d.name.toLowerCase() === name.toLowerCase());
}

function checkRangeThenGoToCheck(drugName, dose, source){
  const drug = findDrug(drugName) || { min: 0, max: Infinity };
  pending = { drug: drugName, dose, source };
  if (dose < drug.min || dose > drug.max){
    $('rangeWarning').textContent =
      `Dose ${dose} is outside the approved range (${drug.min}-${drug.max}). Please change it.`;
    show('rangeWarning');
    show('rangeChangeWrap');
  } else {
    goToCheck();
  }
}

function goToCheck(){
  hide('rangeWarning');
  hide('rangeChangeWrap');
  $('checkSummary').textContent =
    `${pending.drug} — dose: ${pending.dose} (source: ${pending.source})`;
  show('step-check');
}

// ---- Step 0: medication field ----
$('medField').addEventListener('change', () => {
  hide('step-start');
  const val = $('medField').value;
  if (val === 'current'){
    $('currentDrugName').textContent = currentMedication.name;
    $('currentDoseDisplay').textContent = currentMedication.dose + ' ' + currentMedication.unit;
    show('step-current');
  } else if (val === 'new'){
    show('step-new');
  } else if (val === 'formulary'){
    show('step-formulary');
  } else {
    show('step-start');
  }
});

// ---- Current medication path ----
$('currentKeep').addEventListener('click', () => {
  checkRangeThenGoToCheck(currentMedication.name, currentMedication.dose, 'current medication');
});
$('currentChange').addEventListener('click', () => {
  show('currentDoseInputWrap');
});
$('currentDoseConfirm').addEventListener('click', () => {
  const dose = parseFloat($('currentDoseInput').value);
  if (isNaN(dose)) return;
  checkRangeThenGoToCheck(currentMedication.name, dose, 'current medication (changed)');
});

// ---- New medication path ----
$('newDrugSearch').addEventListener('input', () => {
  const q = $('newDrugSearch').value.trim().toLowerCase();
  const list = $('newDrugResults');
  list.innerHTML = '';
  if (!q){ hide('newDrugResults'); return; }
  const matches = formulary.filter(d => d.name.toLowerCase().startsWith(q));
  if (matches.length === 0){ hide('newDrugResults'); return; }
  matches.forEach(d => {
    const li = document.createElement('li');
    li.textContent = d.name;
    li.addEventListener('click', () => {
      $('newDrugSelected').textContent = d.name;
      hide('newDrugResults');
      show('newDrugConfirmWrap');
    });
    list.appendChild(li);
  });
  show('newDrugResults');
});
$('newDrugYes').addEventListener('click', () => {
  hide('newDrugConfirmWrap');
  show('newDoseWrap');
});
$('newDrugNo').addEventListener('click', () => {
  hide('newDrugConfirmWrap');
  $('newDrugSearch').value = '';
  $('newDrugSearch').focus();
});
$('newDoseConfirm').addEventListener('click', () => {
  const dose = parseFloat($('newDoseInput').value);
  if (isNaN(dose)) return;
  checkRangeThenGoToCheck($('newDrugSelected').textContent, dose, 'new medication');
});

// ---- Formulary path ----
$('formSearch').addEventListener('input', () => {
  const q = $('formSearch').value.trim().toLowerCase();
  const list = $('formResults');
  list.innerHTML = '';
  if (!q){ hide('formResults'); return; }
  const matches = formulary.filter(d => d.name.toLowerCase().includes(q));
  if (matches.length === 0){ hide('formResults'); return; }
  matches.forEach(d => {
    const li = document.createElement('li');
    li.textContent = d.name;
    li.addEventListener('click', () => {
      $('formSelected').textContent = d.name;
      hide('formResults');
      show('formConfirmWrap');
    });
    list.appendChild(li);
  });
  show('formResults');
});
$('formYes').addEventListener('click', () => {
  hide('formConfirmWrap');
  show('formDoseWrap');
});
$('formNo').addEventListener('click', () => {
  hide('formConfirmWrap');
  $('formSearch').value = '';
  $('formSearch').focus();
});
$('formDoseConfirm').addEventListener('click', () => {
  const dose = parseFloat($('formDoseInput').value);
  if (isNaN(dose)) return;
  checkRangeThenGoToCheck($('formSelected').textContent, dose, 'formulary');
});

// ---- Range change ----
$('rangeDoseConfirm').addEventListener('click', () => {
  const dose = parseFloat($('rangeDoseInput').value);
  if (isNaN(dose)) return;
  checkRangeThenGoToCheck(pending.drug, dose, pending.source);
});

// ---- Final check ----
$('checkOk').addEventListener('click', () => {
  audit.push(`${pending.drug} — ${pending.dose} (${pending.source})`);
  const list = $('auditList');
  list.innerHTML = '';
  audit.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    list.appendChild(li);
  });
  hide('step-check');
  show('step-done');
});
$('checkChange').addEventListener('click', () => {
  hide('step-check');
  resetAllSteps();
});

$('startOver').addEventListener('click', resetAllSteps);
