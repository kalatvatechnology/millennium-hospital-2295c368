import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteConfig } from "@/config/site";
import {
  fetchCoverageContext,
  fetchSeoEntities,
  listTargetKeywords,
} from "@/lib/data/seo-repository";
import { evaluateAllCoverage, type CoverageResult } from "@/lib/seo/coverage";

/** Loads real CMS data and runs the pure coverage evaluator. No coverage is stored. */
export function useSeoCoverage() {
  const entities = useQuery({ queryKey: ["seo-entities"], queryFn: fetchSeoEntities });
  const targets = useQuery({ queryKey: ["seo-targets"], queryFn: listTargetKeywords });
  const context = useQuery({ queryKey: ["seo-coverage-context"], queryFn: fetchCoverageContext });

  const results = useMemo<CoverageResult[]>(() => {
    if (!entities.data || !targets.data || !context.data) return [];
    return evaluateAllCoverage({
      entities: entities.data,
      targets: targets.data,
      locations: context.data.locations,
      doctorLocations: context.data.doctorLocations,
      usage: context.data.usage,
      siteOrigin: siteConfig.url,
    });
  }, [entities.data, targets.data, context.data]);

  const byTarget = useMemo(() => new Map(results.map((row) => [row.targetId, row])), [results]);

  return {
    results,
    byTarget,
    isPending: entities.isPending || targets.isPending || context.isPending,
    isError: entities.isError || targets.isError || context.isError,
  };
}
