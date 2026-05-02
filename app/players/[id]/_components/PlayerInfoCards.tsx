import StatusCard from "./cards/StatusCard";
import LevelCard from "./cards/LevelCard";
import GamesCard from "./cards/GamesCard";
import TeamCard from "./cards/TeamCard";
import LeagueCard from "./cards/LeagueCard";

type PlayerInfoCardsProps = {
  player: any;
  playerEvents: any[];
  playerReports: any[];
};

export default function PlayerInfoCards({
  player,
  playerEvents,
  playerReports,
}: PlayerInfoCardsProps) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
      <StatusCard player={player} playerEvents={playerEvents} />
      <LevelCard player={player} playerEvents={playerEvents} />
      <GamesCard player={player} playerReports={playerReports} />
      <TeamCard player={player} />
      <LeagueCard player={player} />
    </div>
  );
}