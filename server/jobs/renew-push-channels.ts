import { fetchUsersWithExpiringPushChannels } from "../data/people/fetch-users-with-expiring-push-channels";
import { setUserIsActive } from "../data/people/set-user-is-active";
import { renewPushChannel } from "../google-apis/google-calendar";

const runProcess = async () => {
  console.log("Beginning Push Channel Renewal");

  const userList = await fetchUsersWithExpiringPushChannels();

  if (!userList) {
    console.log("No push channels to renew");
    return;
  }

  for (let i = 0; i < userList.length; i++) {
    const {id} = userList[i];

    try {
      const result = await renewPushChannel(id);
      console.log(`Renewed Push Channel: ${result.pushChannel}`);
    } catch {
      console.log(`Unable to renew push channel for user: ${id}`);
      const deActivatedUser = await setUserIsActive(id, false);
      if (deActivatedUser) console.log(`User DeActivated: ${id}`);
    }

  }

  process.exit();

};

runProcess();
