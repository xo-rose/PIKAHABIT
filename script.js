// ===============================
// LOADING SCREEN
// ===============================

window.addEventListener("load", function () {

    const loader = document.getElementById("loader");

    setTimeout(() => {

        loader.classList.add("opacity-0");

        setTimeout(() => {

            loader.classList.add("hidden");

        }, 700);

    }, 1000);

});


// ===============================
// LOCAL STORAGE
// ===============================

let habits = JSON.parse(localStorage.getItem("habits")) || [];

// ===============================
// ELEMENTS
// ===============================

    const modal = document.getElementById("modal");

    const openModal = document.getElementById("openModal");

    const closeModal = document.getElementById("closeModal");

    const habitForm = document.getElementById("habitForm");

    const habitContainer = document.getElementById("habitContainer");

    const emptyState = document.getElementById("emptyState");


// ===============================
// OPEN MODAL
// ===============================

openModal.addEventListener("click", function () {

    modal.classList.remove("hidden");

    modal.classList.add("flex");

});


// ===============================
// CLOSE MODAL
// ===============================

closeModal.addEventListener("click", function () {

    modal.classList.add("hidden");

    modal.classList.remove("flex");

});


// ===============================
// ADD NEW HABIT
// ===============================

habitForm.addEventListener("submit", function (event) {

    event.preventDefault();

      let name =
        document.getElementById("habitName").value;

    let icon =
        document.getElementById("habitIcon").value;

    const dailyTarget =
        Number(document.getElementById("dailyTarget").value); 
});   


    // If the user selected "Other"

    // if (icon === "other") {

    //     name =
    //         document.getElementById("customHabit").value;

    //     icon =
    //         document.getElementById("customIcon").value;

    // }

// ===============================
// CUSTOM HABIT ELEMENTS
// ===============================

    const habitIcon = document.getElementById("habitIcon");

    const customHabitContainer = document.getElementById("customHabitContainer");

    const customHabit = document.getElementById("customHabit");

    const customIcon =
        document.getElementById("customIcon");

// ===============================
// CUSTOM HABIT OPTION
// ===============================

habitIcon.addEventListener("change", function () {

    if (habitIcon.value === "other") {

        customHabitContainer.classList.remove("hidden");

        customHabit.required = true;

        customIcon.required = true;

    } else {

        customHabitContainer.classList.add("hidden");

        customHabit.required = false;

        customIcon.required = false;

    }

});

    // ===============================
// ADD NEW HABIT
// ===============================

habitForm.addEventListener("submit", function (event) {

    event.preventDefault();


    let name =
        document.getElementById("habitName").value.trim();

    let icon =
        habitIcon.value;


    const dailyTarget =
        Number(document.getElementById("dailyTarget").value);


    // If the user selected "Other"

    if (icon === "other") {

        name = customHabit.value.trim();

        icon = customIcon.value.trim();

    }


    // Prevent empty custom habits

    if (name === "" || icon === "") {

        alert("Please fill in all the habit details.");

        return;

    }


    const newHabit = {

        id: Date.now(),

        name: name,

        icon: icon,

        dailyTarget: dailyTarget,

        dailyProgress: {},

        streak: 0,

        bestStreak: 0,

        lastCompletedDate: null
       

    };


    habits.push(newHabit);


    saveHabits();

    displayHabits();


    habitForm.reset();

    customHabitContainer.classList.add("hidden");

    modal.classList.add("hidden");

    modal.classList.remove("flex");

});



// ===============================
// DISPLAY HABITS
// ===============================


function displayHabits() {


    habitContainer.innerHTML = "";


    if (habits.length === 0) {

        emptyState.classList.remove("hidden");

    } else {

        emptyState.classList.add("hidden");

    }


    habits.forEach(function (habit) {


        const today = getToday();


        // Get today's progress

        const todayProgress =
            habit.dailyProgress[today] || 0;


        // Calculate percentage

        const percentage =
            Math.min(
                Math.round(
                    (todayProgress / habit.dailyTarget) * 100
                ),
                100
            );


        const card = document.createElement("div");


        card.className =
            `rounded-2xl border border-gray-800
             bg-[#1c1c1c] p-6 transition duration-300
             hover:-translate-y-2 hover:border-yellow-400`;


        card.innerHTML = `

            <!-- HABIT HEADER -->

            <div class="flex items-center justify-between">


                <div class="flex items-center gap-4">

                    <div class="text-4xl">

                        ${habit.icon}

                    </div>


                    <div>

                        <h3 class="text-xl font-bold">

                            ${habit.name}

                        </h3>


                        <p class="mt-1 text-sm text-gray-400">

                            ${habit.streak} day streak 🔥

                        </p>

                    </div>

                </div>


                <button
                    onclick="deleteHabit(${habit.id})"
                    class="text-gray-500 transition
                           hover:text-red-500">

                    <i class="fa-solid fa-trash"></i>

                </button>


            </div>


            <!-- PROGRESS -->

            <div class="mt-6">


                <div class="mb-2 flex justify-between">

                    <span class="text-gray-400">

                        Today's Progress

                    </span>


                    <span class="font-bold text-yellow-400">

                        ${todayProgress} / ${habit.dailyTarget}

                    </span>

                </div>


                <!-- PROGRESS BAR -->

                <div class="h-3 overflow-hidden rounded-full bg-gray-700">


                    <div
                        class="h-full rounded-full
                               bg-yellow-400
                               transition-all duration-500"
                        style="width: ${percentage}%">

                    </div>


                </div>


                <p class="mt-2 text-right text-sm text-gray-400">

                    ${percentage}% complete

                </p>


            </div>


            <!-- COUNTER -->

            <div class="mt-6 flex items-center
                        justify-center gap-6">


                <!-- DECREASE -->

                <button
                    onclick="decreaseHabit(${habit.id})"
                    class="flex h-10 w-10 items-center
                           justify-center rounded-full
                           bg-gray-700 text-xl
                           transition hover:bg-gray-600">

                    <i class="fa-solid fa-minus"></i>

                </button>


                <!-- CURRENT COUNT -->

                <span class="text-3xl font-bold text-yellow-400">

                    ${todayProgress}

                </span>


                <!-- INCREASE -->

                <button
                    onclick="increaseHabit(${habit.id})"
                    class="flex h-10 w-10 items-center
                           justify-center rounded-full
                           bg-yellow-400 text-xl
                           text-black transition
                           hover:scale-110
                           hover:bg-yellow-300">

                    <i class="fa-solid fa-plus"></i>

                </button>


            </div>


            <!-- TARGET MESSAGE -->

            <p class="mt-5 text-center text-sm text-gray-400">

                ${
                    percentage >= 100
                    ? "Daily target completed! ⚡"
                    : `${habit.dailyTarget - todayProgress} more to go!`
                }

            </p>

        `;


        habitContainer.appendChild(card);

    });


    updateStats();

}


// ===============================
// COMPLETE HABIT
// ===============================

// function toggleHabit(id) {


//     const habit = habits.find(function (habit) {

//         return habit.id === id;

//     });


//     const today = getToday();


//     if (habit.completedDates.includes(today)) {


//         habit.completedDates = habit.completedDates.filter(function (date) {

//             return date !== today;

//         });


//         habit.streak = Math.max(0, habit.streak - 1);


//     } else {


//         habit.completedDates.push(today);

//         habit.streak++;


//         if (habit.streak > habit.bestStreak) {

//             habit.bestStreak = habit.streak;

//         }

//     }


//     saveHabits();

//     displayHabits();

// }

// ===============================
// INCREASE HABIT
// ===============================

function increaseHabit(id) {


    const habit = habits.find(function (habit) {

        return habit.id === id;

    });


    const today = getToday();


    if (!habit.dailyProgress[today]) {

        habit.dailyProgress[today] = 0;

    }


    habit.dailyProgress[today]++;


    updateStreak(habit);


    saveHabits();

    displayHabits();

}

// ===============================
// DECREASE HABIT
// ===============================

function decreaseHabit(id) {


    const habit = habits.find(function (habit) {

        return habit.id === id;

    });


    const today = getToday();


    if (!habit.dailyProgress[today]) {

        habit.dailyProgress[today] = 0;

    }


    if (habit.dailyProgress[today] > 0) {

        habit.dailyProgress[today]--;

    }


    updateStreak(habit);


    saveHabits();

    displayHabits();

}


// ===============================
// DELETE HABIT
// ===============================

function deleteHabit(id) {


    habits = habits.filter(function (habit) {

        return habit.id !== id;

    });


    saveHabits();

    displayHabits();

}


// ===============================
// GET TODAY'S DATE
// ===============================

function getToday() {

    return new Date().toISOString().split("T")[0];

}


// ===============================
// UPDATE STATISTICS
// ===============================

function updateStats() {


    const today = getToday();


    const completedToday = habits.filter(function (habit) {

        const progress =
            habit.dailyProgress[today] || 0;


        return progress >= habit.dailyTarget;

    }).length;


    const bestStreak = habits.reduce(function (highest, habit) {

        return Math.max(highest, habit.bestStreak);

    }, 0);


    document.getElementById("totalHabits").textContent = habits.length;


    document.getElementById("completedToday").textContent = completedToday;


    document.getElementById("bestStreak").textContent = bestStreak;

}

// ===============================
// UPDATE STREAK
// ===============================

function updateStreak(habit) {


    const today = getToday();


    const todayProgress =
        habit.dailyProgress[today] || 0;


    // If today's target is completed

    if (todayProgress >= habit.dailyTarget) {


        // Avoid increasing streak repeatedly

        if (habit.lastCompletedDate !== today) {

            habit.streak++;

            habit.lastCompletedDate = today;


            if (habit.streak > habit.bestStreak) {

                habit.bestStreak = habit.streak;

            }

        }

    }

}


// ===============================
// SAVE DATA
// ===============================

function saveHabits() {

    localStorage.setItem("habits", JSON.stringify(habits));

}


// ===============================
// INITIAL DISPLAY
// ===============================

displayHabits();