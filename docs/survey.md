## Querying survey data

The following query will pull response data from a given date range back in a workable format.

```
SELECT *
FROM   crosstab(
   'select id, manuscript_id, updated, items."questionId", items.answer
	from public.survey_response, jsonb_to_recordset(public.survey_response.response->''answers'') as items(answer text, "questionId" text)
	where updated BETWEEN ''07/21/2021 10:00:00'' and ''12/31/2021 00:00:00'' order by 1,2,3'
,  $$SELECT unnest('{countryIndentifyAs,countryOfResidence,genderIdentity, genderSelfDescribe,independentResearcher,independentResearcherYear,raceOrEthnicity,secondCountryOfResidence,submittingAs}'::text[])$$
   ) AS answer (id uuid, manuscript_id uuid, updated text, “countryIndentifyAs” text, ”countryOfResidence” text, ”genderIdentity” text, “genderSelfDescribe” text, ”independentResearcher” text, “independentResearcherYear” text, ”raceOrEthnicity” text, “secondCountryOfResidence” text, ”submittingAs” text)
   order by updated;
```

The DB will need the tablefunc extension added to be able to run the `crosstab` function. This can be done by running the following once over the db

```
CREATE EXTENSION IF NOT EXISTS tablefunc;
```

## Legacy Survey Data

The survey in the submission wizard was changed around 10am on 21st July 2021 to the new EDI survey, but there might be some cases where you need to get the older data in which case you can use the below query.

```
SELECT *
FROM   crosstab(
   'select id, manuscript_id, updated, items."questionId", items.answer
	from public.survey_response, jsonb_to_recordset(public.survey_response.response->''answers'') as items(answer text, "questionId" text)
	where updated BETWEEN ''01/01/2021 00:00:00'' and ''07/21/2021 10:00:00'' order by 1,2,3'
,  $$SELECT unnest('{question1,question2,question3}'::text[])$$
   ) AS answer (id uuid, manuscript_id uuid, updated text, “question1” text, ”question2” text, ”question3” text)
   order by updated;
```
