import type { PlayerScoutingReport } from "@/src/lib/playerScoutingReports";

type Props = {
  reports: PlayerScoutingReport[];
};

function gradeItems(report: PlayerScoutingReport) {
  return [
    ["Hit", report.hit],
    ["Power", report.power],
    ["Run", report.run],
    ["Arm", report.arm],
    ["Field", report.field],
    ["Fastball", report.fastball],
    ["Breaking", report.breaking],
    ["Changeup", report.changeup],
    ["Slider", report.slider],
    ["Curveball", report.curveball],
    ["Command", report.command],
    ["Control", report.control],
    ["Stuff", report.stuff],
    ["Overall", report.overall],
    ["FV", report.fv],
  ].filter(([, value]) => value !== null && value !== undefined);
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
              {gradeItems(report).map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-lg bg-slate-900 px-3 py-2"
                >
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="text-lg font-black text-white">{value}</div>
                </div>
              ))}
            </div>

            {report.summary ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {report.summary}
              </p>
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