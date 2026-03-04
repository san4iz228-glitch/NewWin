let currentUser = null;
let events = [];
let userBets = []; // історія ставок

function register() {
    const username = document.getElementById("username").value.trim();
    if(!username) return alert("Введіть ім'я користувача!");
    if(localStorage.getItem(username)) return alert("Користувач вже існує!");
    localStorage.setItem(username, JSON.stringify({balance:1000}));
    alert("Користувач зареєстрований! Баланс 1000 грн");
}

function login() {
    const username = document.getElementById("username").value.trim();
    const userData = localStorage.getItem(username);
    if(!userData) return alert("Користувача не знайдено!");
    currentUser = username;
    document.getElementById("user-name").textContent = currentUser;
    document.getElementById("profile-name").textContent = currentUser;
    document.getElementById("balance").textContent = JSON.parse(userData).balance;
    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    // Додаємо 1 матч
    events = [{
        id:1,
        home:"Динамо Київ",
        away:"Шахтар Донецьк",
        odds: {p1:2.5, draw:3.5, p2:2.2},
        homeGoals:0,
        awayGoals:0,
        bets:[],
        settled:false,
        startTime:new Date(Date.now()+2*60*1000),
        duration:90*60
    }];
    renderEvents();
    startMatches();
}

function logout() {
    currentUser=null;
    document.getElementById("dashboard").style.display="none";
    document.getElementById("auth").style.display="block";
}

function showTab(tabId){
    document.querySelectorAll(".tab-content").forEach(t=>t.style.display="none");
    document.getElementById(tabId).style.display="block";
}

function renderEvents(){
    const container = document.getElementById("events");
    container.innerHTML="";
    const now = new Date();
    events.forEach(event=>{
        const canBet = now < event.startTime;
        const diff = event.startTime - now;
        let minutes = Math.floor(diff/60000); let seconds=Math.floor((diff%60000)/1000);
        if(minutes<0) minutes=0; if(seconds<0) seconds=0;
        const div = document.createElement("div");
        div.className="event";
        div.innerHTML=`<span>${event.home} ${event.homeGoals} - ${event.awayGoals} ${event.away}</span>
        <span>${canBet ? "Старт через: "+minutes+"м "+seconds+"с":"Матч йде/завершено"}</span>
        <input type="number" id="bet-${event.id}" placeholder="Сума" ${!canBet?"disabled":""}>
        <select id="choice-${event.id}" ${!canBet?"disabled":""}>
            <option value="p1">П1 (${event.odds.p1})</option>
            <option value="draw">Нічия (${event.odds.draw})</option>
            <option value="p2">П2 (${event.odds.p2})</option>
        </select>
        <button class="btn" onclick="placeBet(${event.id})" ${!canBet?"disabled":""}>Ставити</button>`;
        container.appendChild(div);
    });
    renderBetsHistory();
}

function placeBet(eventId){
    const event = events.find(e=>e.id===eventId);
    const amount = parseFloat(document.getElementById(`bet-${eventId}`).value);
    const choice = document.getElementById(`choice-${eventId}`).value;
    if(!amount || amount<=0) return alert("Введіть суму!");
    const userData = JSON.parse(localStorage.getItem(currentUser));
    if(amount>userData.balance) return alert("Недостатньо балансу!");
    userData.balance -= amount;
    localStorage.setItem(currentUser, JSON.stringify(userData));
    event.bets.push({user:currentUser, amount, choice});
    userBets.push({match:event.home+"-"+event.away, amount, choice, result:null});
    renderEvents();
}

function renderBetsHistory(){
    const ul = document.getElementById("payment-history");
    ul.innerHTML="";
    userBets.forEach(b=>{
        const li = document.createElement("li");
        li.textContent = `${b.match} - ${b.choice} - ${b.amount} грн`;
        if(b.result==="win") li.className="win";
        if(b.result==="lose") li.className="lose";
        ul.appendChild(li);
    });
}

function startMatches(){
    setInterval(()=>{
        const now = new Date();
        events.forEach(event=>{
            if(!event.settled && now >= event.startTime){
                const elapsed = (now - event.startTime)/1000;
                if(elapsed <= event.duration){
                    if(Math.random()<0.02) event.homeGoals++;
                    if(Math.random()<0.02) event.awayGoals++;
                }else{
                    event.settled=true;
                    event.bets.forEach(bet=>{
                        let win=false;
                        if(bet.choice=="p1" && event.homeGoals>event.awayGoals) win=true;
                        else if(bet.choice=="p2" && event.homeGoals<event.awayGoals) win=true;
                        else if(bet.choice=="draw" && event.homeGoals==event.awayGoals) win=true;

                        if(win){
                            bet.result="win";
                            const userData=JSON.parse(localStorage.getItem(bet.user));
                            const odd=event.odds[bet.choice];
                            userData.balance += bet.amount*odd;
                            localStorage.setItem(bet.user, JSON.stringify(userData));
                        }else{
                            bet.result="lose";
                        }
                        userBets.forEach(ub=>{
                            if(ub.match==event.home+"-"+event.away && ub.choice==bet.choice && ub.amount==bet.amount && ub.result==null)
                                ub.result=win?"win":"lose";
                        });
                    });
                }
            }
        });
        renderEvents();
        if(currentUser){
            const userData=JSON.parse(localStorage.getItem(currentUser));
            document.getElementById("balance").textContent=userData.balance;
        }
    },1000);
}