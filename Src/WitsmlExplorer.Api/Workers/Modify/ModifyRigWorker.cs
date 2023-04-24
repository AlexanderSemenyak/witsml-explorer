using System.Threading.Tasks;

using Microsoft.Extensions.Logging;

using Witsml;
using Witsml.Data.Rig;

using WitsmlExplorer.Api.Jobs;
using WitsmlExplorer.Api.Models;
using WitsmlExplorer.Api.Query;
using WitsmlExplorer.Api.Services;

namespace WitsmlExplorer.Api.Workers.Modify
{
    public class ModifyRigWorker : BaseWorker<ModifyRigJob>, IWorker
    {
        public JobType JobType => JobType.ModifyRig;

        public ModifyRigWorker(ILogger<ModifyRigJob> logger, IWitsmlClientProvider witsmlClientProvider) : base(witsmlClientProvider, logger) { }
        public override async Task<(WorkerResult, RefreshAction)> Execute(ModifyRigJob job)
        {
            WitsmlRigs modifyRigQuery = RigQueries.CreateRig(job.Rig);
            QueryResult modifyRigResult = await GetTargetWitsmlClientOrThrow().UpdateInStoreAsync(modifyRigQuery);

            if (!modifyRigResult.IsSuccessful)
            {
                const string errorMessage = "Failed to modify rig object";
                Logger.LogError("{ErrorMessage}. {jobDescription}", errorMessage, job.Description());
                return (new WorkerResult(GetTargetWitsmlClientOrThrow().GetServerHostname(), false, errorMessage, modifyRigResult.Reason), null);
            }

            Logger.LogInformation("Rig modified. {jobDescription}", job.Description());
            RefreshObjects refreshAction = new(GetTargetWitsmlClientOrThrow().GetServerHostname(), job.Rig.WellUid, job.Rig.WellboreUid, EntityType.Rig);
            WorkerResult workerResult = new(GetTargetWitsmlClientOrThrow().GetServerHostname(), true, $"Rig {job.Rig.Name} updated for {job.Rig.WellboreName}");

            return (workerResult, refreshAction);
        }
    }
}
