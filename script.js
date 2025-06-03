// Show/Hide sections based on button click
function showSection(id) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec => {
    sec.classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

// Handle profile image upload
const uploadInput = document.getElementById('upload');
const profileImage = document.getElementById('profileImage');

uploadInput.addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      profileImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Data storage keys
const STORAGE_KEY_HISTORY = 'calorieWaterHistory';
const STORAGE_KEY_PLAN = 'userPlanData';

// History data load/save
function loadHistory() {
  const historyJSON = localStorage.getItem(STORAGE_KEY_HISTORY);
  return historyJSON ? JSON.parse(historyJSON) : [];
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

// Plan data load/save
function loadPlan() {
  const planJSON = localStorage.getItem(STORAGE_KEY_PLAN);
  return planJSON ? JSON.parse(planJSON) : null;
}

function savePlan(plan) {
  localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(plan));
}

// Update Overview section with history sums and plan info
function updateOverview() {
  const history = loadHistory();

  // Sum calories and water
  const totalCalories = history.reduce((sum, item) => sum + item.calories, 0);
  const totalWater = history.reduce((sum, item) => sum + item.water, 0);

  document.getElementById('calories').textContent = totalCalories;
  document.getElementById('water').textContent = totalWater;

  // Update history timestamps
  const lastCalorie = history.filter(h => h.calories > 0).slice(-1)[0];
  const lastWater = history.filter(h => h.water > 0).slice(-1)[0];
  document.getElementById('calorie-time').textContent = lastCalorie ? `Last: ${new Date(lastCalorie.time).toLocaleString()}` : '';
  document.getElementById('water-time').textContent = lastWater ? `Last: ${new Date(lastWater.time).toLocaleString()}` : '';

  // Update plan info
  const plan = loadPlan();
  if (plan) {
    document.getElementById('userName').textContent = plan.name || '--';
    document.getElementById('userAge').textContent = plan.age || '0';
    document.getElementById('userHeight').textContent = plan.height || '0';
    document.getElementById('userWeight').textContent = plan.weight || '0';
    document.getElementById('userGender').textContent = plan.gender || '--';

    document.getElementById('maintCalories').textContent = plan.maintenanceCalories || 0;
    document.getElementById('mildCalories').textContent = plan.mildCalories || 0;
    document.getElementById('aggrCalories').textContent = plan.aggressiveCalories || 0;

    document.getElementById('calorieLimit').textContent = plan.currentCalorieLimit || 0;
    document.getElementById('waterLimit').textContent = plan.waterLimit || 0;
  } else {
    document.getElementById('userName').textContent = '--';
    document.getElementById('userAge').textContent = '0';
    document.getElementById('userHeight').textContent = '0';
    document.getElementById('userWeight').textContent = '0';
    document.getElementById('userGender').textContent = '--';

    document.getElementById('maintCalories').textContent = '0';
    document.getElementById('mildCalories').textContent = '0';
    document.getElementById('aggrCalories').textContent = '0';

    document.getElementById('calorieLimit').textContent = '0';
    document.getElementById('waterLimit').textContent = '0';
  }
}

// Render history list with checkboxes
function renderHistory() {
  const history = loadHistory();
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li>No history yet.</li>';
    return;
  }

  history.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <input type="checkbox" class="deleteCheck" data-index="${index}" />
      <span><strong>${item.calories}</strong> kcal, <strong>${item.water}</strong> ml - 
      ${new Date(item.time).toLocaleString()}</span>
    `;
    historyList.appendChild(li);
  });
}

// Add new input data to history
document.getElementById('submitInputBtn').addEventListener('click', () => {
  const calories = parseInt(document.getElementById('inputCalories').value) || 0;
  const water = parseInt(document.getElementById('inputWater').value) || 0;

  if (calories === 0 && water === 0) {
    alert('Please enter calories or water intake');
    return;
  }

  const history = loadHistory();
  history.push({
    calories,
    water,
    time: Date.now()
  });
  saveHistory(history);

  // Clear inputs
  document.getElementById('inputCalories').value = '';
  document.getElementById('inputWater').value = '';

  renderHistory();
  updateOverview();
});

// Delete selected history items
document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
  const checks = document.querySelectorAll('#historyList input.deleteCheck:checked');
  if (checks.length === 0) {
    alert('Please select at least one entry to delete.');
    return;
  }

  let history = loadHistory();
  // Gather indices to delete
  const indicesToDelete = Array.from(checks).map(cb => parseInt(cb.dataset.index));
  // Filter out items with those indices
  history = history.filter((_, idx) => !indicesToDelete.includes(idx));
  saveHistory(history);

  renderHistory();
  updateOverview();
});

// Calculate calorie plans and water intake
document.getElementById('calculateBtn').addEventListener('click', () => {
  const name = document.getElementById('planName').value.trim();
  const age = parseInt(document.getElementById('planAge').value);
  const gender = document.getElementById('planGender').value;
  const height = parseFloat(document.getElementById('planHeight').value);
  const weight = parseFloat(document.getElementById('planWeight').value);
  const activity = parseFloat(document.getElementById('planActivity').value);
  const goal = document.getElementById('planGoal').value;

  if (!name || !age || !height || !weight || !activity) {
    alert('Please fill in all fields.');
    return;
  }

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // Total Daily Energy Expenditure
  const tdee = bmr * activity;

  const maintenanceCalories = Math.round(tdee);
  const mildCalories = Math.round(tdee * 0.85);
  const aggressiveCalories = Math.round(tdee * 0.75);

  let currentCalorieLimit = maintenanceCalories;
  if (goal === 'mild') currentCalorieLimit = mildCalories;
  else if (goal === 'aggressive') currentCalorieLimit = aggressiveCalories;

  // Water intake: approx 40 ml per kg body weight
  const waterLimit = Math.round(weight * 40);

  // Save plan data to localStorage
  const planData = {
    name,
    age,
    gender,
    height,
    weight,
    activity,
    goal,
    maintenanceCalories,
    mildCalories,
    aggressiveCalories,
    currentCalorieLimit,
    waterLimit,
  };
  savePlan(planData);

  // Update UI with results
  const planResult = document.getElementById('planResult');
  planResult.innerHTML = `
    <p><strong>Maintenance Calories:</strong> ${maintenanceCalories} kcal/day</p>
    <p><strong>Mild Deficit (15%):</strong> ${mildCalories} kcal/day</p>
    <p><strong>Aggressive Deficit (25%):</strong> ${aggressiveCalories} kcal/day</p>
    <p><strong>Recommended Water Intake:</strong> ${waterLimit} ml/day</p>
    <p><strong>Current Calorie Limit based on Goal (<em>${goal}</em>):</strong> ${currentCalorieLimit} kcal/day</p>
  `;

  updateOverview();
});

// Initialize page
function init() {
  showSection('input');
  renderHistory();
  updateOverview();
}
init();
