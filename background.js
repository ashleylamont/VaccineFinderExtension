function ready(...args) {
  console.log("Test");
  console.log({args});
}

async function checkForAppointment() {
  const delay = () => new Promise(resolve => {window.setTimeout(resolve, 500)});

  let noResults;
  let results;
  do {
    await delay();
    noResults = document.documentElement.innerHTML.includes("No Matching Results");
    results = document.documentElement.innerHTML.includes("Medical Centres")
  } while(!noResults && !results);
  // return document.documentElement.innerHTML.includes("No Matching Results");
  chrome.runtime.sendMessage(noResults);
}

function success() {
  console.log("SUCESS");
}

function failure() {
  console.log("FAILURE");
}

function getState() {
  console.log("Checking load state");
  return document.readyState;
}

function debug(arg){
  console.log(arg);
}

chrome.action.onClicked.addListener((tab) => {
    const reload = () => {
      chrome.tabs.reload(tab.id, {}, ready);
      const checkLoaded = setInterval(async () => {
        data = await chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: getState
        });
        if (data[0].result === "complete") {
          clearInterval(checkLoaded);
          onReloaded();
        }

      }, 500);
    }

    const onReloaded = async () => {

      const message = new Promise(resolve => {
        const listener = request => {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(request);
        };
        chrome.runtime.onMessage.addListener(listener);
      });


      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: checkForAppointment,
      });

      const noResults = await message;

      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: debug,
        args: [noResults]
      })
      console.log({noResults});
      if (noResults) {
        setTimeout(reload, 5000);
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: failure,
        });
      } else {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: success,
        });
        const opts = {
          type: 'basic',
          title: 'Booking Available',
          message: 'Your HotDoc Search has returned a result!',
          priority: 2,
          iconUrl: 'hotdoc.png',
          requireInteraction: true
        };
        chrome.notifications.create('hotdocAlert', opts);
        chrome.notifications.onClicked.addListener((notificationId)=>{
          if(notificationId === 'hotdocAlert'){
            chrome.tabs.update(tab.id, {highlighted: true});
          }
        })
      }
    }
    reload();
  }
);
