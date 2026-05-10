import type { PlayerScoutingReport } from "@/src/lib/playerScoutingReports";

type Props = {
  reports: PlayerScoutingReport[];
};

function gradeItems(report: PlayerScoutingReport) {
  return [
    ["ETA", report.eta, null],
    
    ["Hit", report.hit, report.hit_future],
    ["Power", report.power, report.power_future],
    ["Game Power", report.game_power, report.game_power_future],
    ["Raw Power", report.raw_power, report.raw_power_future],
    ["Run", report.run, report.run_future],
    ["Arm", report.arm, report.arm_future],
    ["Field", report.field, report.field_future],

    ["Fastball", report.fastball, report.fastball_future],
    ["Breaking", report.breaking, report.breaking_future],
    ["Changeup", report.changeup, report.changeup_future],
    ["Slider", report.slider, report.slider_future],
    ["Curveball", report.curveball, report.curveball_future],
    ["Cutter", report.cutter, report.cutter_future],
    ["Splitter", report.splitter, report.splitter_future],
    ["Command", report.command, report.command_future],
    ["Control", report.control, report.control_future],
    ["Stuff", report.stuff, report.stuff_future],

    ["Overall", report.overall, null],
    ["FV", report.fv, null],
  ].filter(([, value]) => value !== null && value !== undefined);
}

function formatGrade(current: unknown, future: unknown) {
  if (future !== null && future !== undefined && future !== "") {
    return `${current} / ${future}`;
  }

  return String(current ?? "-");
}

export default function PlayerScoutingReports({ reports }: Props) {
  if (reports.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-xl font-black text-white">球探評分</h2>

      <div className="mt-4 grid gap-4">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sky-300">
                {report.source}
                {report.source_team ? `｜${report.source_team}` : ""}
                {report.source_list ? ` ${report.source_list}` : ""}
                {report.source_rank ? ` #${report.source_rank}` : ""}
              </h3>

              {report.report_year ? (
                <span className="text-xs text-slate-400">
                  {report.report_year}
                </span>
              ) : null}

            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {gradeItems(report).map(([label, value, future]) => (
                <div
                  key={String(label)}
                  className="rounded-lg bg-slate-900 px-3 py-2"
                >
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="text-lg font-black text-white">
                    {formatGrade(value, future)}
                  </div>
                </div>
              ))}
            </div>

            {report.summary ? (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  球探摘要
                </div>

                <p className="text-sm leading-7 text-slate-300 whitespace-pre-line">
                  {report.summary}
                </p>
              </div>
            ) : null}

            {report.source_url ? (
              <a
                href={report.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-sky-300 hover:text-sky-200 hover:underline"
              >
                查看來源
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}