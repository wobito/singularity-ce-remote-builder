import * as dayjs from "dayjs";

export const isEphemeral = (libraryRef: string, completeTime: string) => {
  return (
    libraryRef.match(/^library:\/\/.+\/remote-builds\/rb-.+/) &&
    dayjs().diff(dayjs(completeTime), "hour") > 24
  );
};
