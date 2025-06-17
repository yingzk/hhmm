CREATE TABLE public.geo_abbreviations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    abbreviation text NOT NULL,
    full_name text NOT NULL,
    copied_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT geo_abbreviations_pkey PRIMARY KEY (id)
);

ALTER TABLE public.geo_abbreviations ENABLE ROW LEVEL SECURITY;

-- 创建索引以提高搜索性能 (可选但推荐)
CREATE INDEX abbreviation_idx ON public.geo_abbreviations USING btree (abbreviation);
CREATE INDEX full_name_idx ON public.geo_abbreviations USING btree (full_name);
CREATE INDEX copied_count_idx ON public.geo_abbreviations USING btree (copied_count DESC);

CREATE OR REPLACE FUNCTION public.increment_copied_count(row_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE geo_abbreviations
  SET copied_count = copied_count + 1
  WHERE id = row_id;
END;
$function$;

-- 插入示例数据 (仅在表为空时运行)
INSERT INTO public.geo_abbreviations (abbreviation, full_name, copied_count)
SELECT * FROM (VALUES
    ('GSDJ', '公示地价', 0),
    ('JZDJ', '基准地价', 0),
    ('TDLY', '土地利用', 0),
    ('GHGH', '规划规划', 0),
    ('ZRZY', '自然资源', 0),
    ('GTPO', '国土空间规划', 0),
    ('TDQX', '土地权属', 0),
    ('JBNT', '基本农田', 0),
    ('STTD', '生态土地', 0),
    ('CJYD', '城建用地', 0)
) AS tmp (abbreviation, full_name, copied_count)
WHERE NOT EXISTS (SELECT 1 FROM public.geo_abbreviations); 