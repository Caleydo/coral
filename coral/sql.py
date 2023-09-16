import logging

import hdbscan
import numpy as np
import pandas as pd
from flask import Flask, abort, jsonify, request
from sklearn.cluster import KMeans
from visyn_core.security import login_required
from sklearn.metrics import silhouette_score


# import pydevd_pycharm
# pydevd_pycharm.settrace('localhost', port=5678, stdoutToServer=True, stderrToServer=True)


DEBUG = False

if DEBUG:
# for debugging. Shut down api-1-container
  from settings import get_settings
  from sql_query_mapper import QueryElements
else:
  from .settings import get_settings
  from .sql_query_mapper import QueryElements



_log = logging.getLogger(__name__)

app = Flask(__name__)
config = get_settings()


@app.route("/create", methods=["GET", "POST"])
@login_required
def insert_cohort():
    # create?name=dummy&previous=-1&isInitial=1&database=tdp_publicdb&schema=tissue&table=tdp_tissue&statement=SELECT * FROM tissue.tdp_tissue
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameters are needed:
    - name: name of the cohort
    - isInitial: 0 if it has a parent cohort, 1 if it is the initial table
    - previous: id of the previous cohort, -1 for the initial cohort
    - database: database of the entitiy tale
    - schema: schema of the entity table
    - table: table of the entitiy""".format(
        route="create"
    )

    _log.debug("/create start")

    try:
        query = QueryElements()
        new_cohort = query.create_cohort(request.values, error_msg)  # crate cohort from args
        _log.debug("/create created cohort object")
        new_cohort_response = query.add_cohort_to_db(new_cohort)  # save new cohort into DB
        _log.debug("/create end")
        return new_cohort_response
    except RuntimeError as error:
        abort(400, error)


@app.route("/createUseEqulasFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_equals_filtered():
    # createUseEqulasFilter?cohortId=1&name=TeSt&attribute=gender&numeric=false&values=female%26%23x2e31%3Bmale
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - attribute: column used to filter
    - numeric: boolean if the attribute is number or not
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="createWithEqualsFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        new_cohort = query.create_cohort_equals_filtered(request.values, cohort, error_msg)  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/createUseTreatmentFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_treatment_filtered():
    # createUseTreatmentFilter?cohortId=29892&name=testTreatment&agent=Crizotinib%26%23x2e31%3BCisplatin&regimen=2&baseAgent=true
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - agent: filter value(s) for the agent, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'
    - regimen: filter value for the regimen_number, e.g. '1'
    - baseAgent: boolean if the agents are base agents (single agents), e.g. 'false'
    At least one of the two attributes (agent, regimen) has to be defined !'""".format(
        route="createUseTreatmentFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        new_cohort = query.create_cohort_treatment_filtered(request.values, cohort, error_msg)  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/dataUseEqulasFilter", methods=["GET", "POST"])
@login_required
def data_cohort_equals_filtered():
    # dataUseEqulasFilter?cohortId=1&attribute=gender&numeric=false&values=female%26%23x2e31%3Bmale
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - attribute: column used to filter
    - numeric: boolean if the attribute is number or not
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="dataUseEqulasFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_equals_filtered() function
        clone_cohort = query.create_cohort_equals_filtered(dict_args, cohort, error_msg)  # get filtered cohort from args and cohort

        del dict_args["attribute"]  # remove attribute element to show all data
        sql_text = query.get_cohort_data_sql(dict_args, clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/sizeUseEqulasFilter", methods=["GET", "POST"])
@login_required
def size_cohort_equals_filtered():
    # sizeUseEqulasFilter?cohortId=1&attribute=gender&numeric=false&values=female%26%23x2e31%3Bmale
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - attribute: column used to filter
    - numeric: boolean if the attribute is number or not
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="sizeUseEqulasFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_equals_filtered() function
        clone_cohort = query.create_cohort_equals_filtered(dict_args, cohort, error_msg)  # get filtered cohort from args and cohort

        sql_text = query.get_cohort_size_sql(clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/createUseNumFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_num_filtered():
    # createUseNumFilter?cohortId=1&name=TeSt&attribute=age&ranges=gt_2%lte_5;gte_10
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - attribute: column used to filter
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="createWithNumFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        new_cohort = query.create_cohort_num_filtered(request.values, cohort, error_msg)  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/dataUseNumFilter", methods=["GET", "POST"])
@login_required
def data_cohort_num_filtered():
    # dataUseNumFilter?cohortId=1&attribute=age&ranges=gt_2%lte_5;gte_10
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - attribute: column used to filter
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="dataUseNumFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_num_filtered() function
        clone_cohort = query.create_cohort_num_filtered(dict_args, cohort, error_msg)  # get filtered cohort from dict_args and cohort

        del dict_args["attribute"]  # remove attribute element to show all data
        sql_text = query.get_cohort_data_sql(dict_args, clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/sizeUseNumFilter", methods=["GET", "POST"])
@login_required
def size_cohort_num_filtered():
    # sizeUseNumFilter?cohortId=1&attribute=age&ranges=gt_2%lte_5;gte_10
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - attribute: column used to filter
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="sizeUseNumFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_num_filtered() function
        clone_cohort = query.create_cohort_num_filtered(dict_args, cohort, error_msg)  # get filtered cohort from dict_args and cohort

        sql_text = query.get_cohort_size_sql(clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/createUseGeneNumFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_gene_num_filtered():
    # createUseGeneNumFilter?cohortId=1&name=TeSt&table=copynumber&attribute=relativecopynumber&ensg=ENSG00000141510&ranges=gt_2%lte_5;gte_10
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="createUseGeneNumFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        new_cohort = query.create_cohort_gene_num_filtered(request.values, cohort, error_msg)  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/dataUseGeneNumFilter", methods=["GET", "POST"])
@login_required
def data_cohort_gene_num_filtered():
    # dataUseGeneNumFilter?cohortId=1&table=copynumber&attribute=relativecopynumber&ensg=ENSG00000141510&ranges=gt_2%lte_5;gte_10
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="dataUseGeneNumFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_gene_num_filtered() function
        clone_cohort = query.create_cohort_gene_num_filtered(dict_args, cohort, error_msg)  # get filtered cohort from dict_args and cohort

        del dict_args["attribute"]  # remove attribute element to show all data
        sql_text = query.get_cohort_data_sql(dict_args, clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/sizeUseGeneNumFilter", methods=["GET", "POST"])
@login_required
def size_cohort_gene_num_filtered():
    # sizeUseGeneNumFilter?cohortId=1&table=copynumber&attribute=relativecopynumber&ensg=ENSG00000141510&ranges=gt_2%lte_5;gte_10
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="sizeUseGeneNumFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_gene_num_filtered() function
        clone_cohort = query.create_cohort_gene_num_filtered(dict_args, cohort, error_msg)  # get filtered cohort from dict_args and cohort

        sql_text = query.get_cohort_size_sql(clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/createUseGeneEqualsFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_gene_equals_filtered():
    # createUseGeneEqualsFilter?cohortId=1&name=TestGeneEquals&table=mutation&attribute=dna_mutated&ensg=ENSG00000141510&numeric=false&values=false%26%23x2e31%3Btrue
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - numeric: boolean if the attribute is number or not
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="createUseGeneEqualsFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        new_cohort = query.create_cohort_gene_equals_filtered(request.values, cohort, error_msg)  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/dataUseGeneEqualsFilter", methods=["GET", "POST"])
@login_required
def data_cohort_gene_equals_filtered():
    # dataUseGeneEqualsFilter?cohortId=1&name=TestGeneEquals&table=mutation&attribute=dna_mutated&ensg=ENSG00000141510&numeric=false&values=false%26%23x2e31%3Btrue
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - numeric: boolean if the attribute is number or not
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="dataUseGeneEqualsFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_gene_equals_filtered() function
        clone_cohort = query.create_cohort_gene_equals_filtered(
            dict_args, cohort, error_msg
        )  # get filtered cohort from dict_args and cohort

        del dict_args["attribute"]  # remove attribute element to show all data
        sql_text = query.get_cohort_data_sql(dict_args, clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/sizeUseGeneEqualsFilter", methods=["GET", "POST"])
@login_required
def size_cohort_gene_equals_filtered():
    # sizeUseGeneEqualsFilter?cohortId=1&name=TestGeneEquals&table=mutation&attribute=dna_mutated&ensg=ENSG00000141510&numeric=false&values=false%26%23x2e31%3Btrue
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - numeric: boolean if the attribute is number or not
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="sizeUseGeneEqualsFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_gene_equals_filtered() function
        clone_cohort = query.create_cohort_gene_equals_filtered(
            dict_args, cohort, error_msg
        )  # get filtered cohort from dict_args and cohort

        sql_text = query.get_cohort_size_sql(clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/getDBCohorts", methods=["GET", "POST"])
@login_required
def database_cohort_data():
    # getDBCohorts?cohortIds=2%26%23x2e31%3B50
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortIds: id(s) of the cohort(s), separator '&#x2e31;', e.g. 'id1%26%23x2e31%3Bid2'""".format(
        route="getDBCohorts"
    )

    try:
        query = QueryElements()
        sql_text = query.get_cohorts_by_id_sql(request.values, error_msg)  # get sql statement to retrieve cohorts
        # print('cohort DB SQL:', sql_text)
        return query.execute_sql_query(sql_text, "cohort")  # execute sql statement
    except RuntimeError as error:
        abort(400, error)


@app.route("/updateCohortName", methods=["GET", "POST"])
@login_required
def update_cohort_name():
    # updateCohortName?cohortId=37151&name=123Test123Test
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort
    - name: new name of the cohort""".format(
        route="updateCohortName"
    )

    try:
        query = QueryElements()

        return query.update_cohort_name_sql(request.values, error_msg)  # updates cohort and returns it as json
    except RuntimeError as error:
        abort(400, error)


@app.route("/cohortData", methods=["GET", "POST"])
@login_required
def data_cohort():
    # cohortData?cohortId=2&attribute=gender
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort
    There is also one optional parameter:
    - attribute: one column of the entity table""".format(
        route="cohortData"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        sql_text = query.get_cohort_data_sql(request.values, cohort)  # get sql statement to retrieve data
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement
    except RuntimeError as error:
        abort(400, error)


@app.route("/size", methods=["GET", "POST"])
@login_required
def size_cohort():
    # size?cohortId=2
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort""".format(
        route="size"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        sql_text = query.get_cohort_size_sql(cohort)  # get sql statement to get size of cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement
    except RuntimeError as error:
        abort(400, error)


@app.route("/geneScore", methods=["GET", "POST"])
@login_required
def gene_score_tissue():
    # geneScore?cohortId=2&table=copynumber&attribute=relativecopynumber&ensg=ENSG00000141510
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameters are needed:
    - cohortId: id of the cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute
    - ensg: name of the gene""".format(
        route="geneScore"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        sql_text = query.get_gene_score_sql(request.values, cohort, error_msg)  # get sql statement to get gene score for tissue
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement
    except RuntimeError as error:
        abort(400, error)


@app.route("/celllineDepletionScore", methods=["GET", "POST"])
@login_required
def depletion_score_cellline():
    # celllineDepletionScore?cohortId=3&table=depletionscore&attribute=rsa&ensg=ENSG00000141510&depletionscreen=Drive
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameters are needed:
    - cohortId: id of the cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute
    - ensg: name of the gene
    - depletionscreen: name of the screen""".format(
        route="celllineDepletionScore"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        sql_text = query.get_gene_score_depletion_sql(request.values, cohort, error_msg)  # get sql statement to get depletion score
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement
    except RuntimeError as error:
        abort(400, error)


@app.route("/createUseDepletionScoreFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_depletion_score_filtered():
    # createUseDepletionScoreFilter?cohortId=3&name=TeStDepletion&table=depletionscore&attribute=rsa&ensg=ENSG00000141510&depletionscreen=Drive&ranges=gte_-0.1%lt_-0.01
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - depletionscreen: name of the screen
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="createUseDepletionScoreFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        new_cohort = query.create_cohort_depletion_score_filtered(
            request.values, cohort, error_msg
        )  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/dataUseDepletionScoreFilter", methods=["GET", "POST"])
@login_required
def data_cohort_depletion_score_filtered():
    # dataUseDepletionScoreFilter?cohortId=3&table=depletionscore&attribute=rsa&ensg=ENSG00000141510&depletionscreen=Drive&ranges=gte_-0.1%lt_-0.01
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - depletionscreen: name of the screen
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="dataUseDepletionScoreFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_depletion_score_filtered() function
        clone_cohort = query.create_cohort_depletion_score_filtered(
            dict_args, cohort, error_msg
        )  # get filtered cohort from dict_args and cohort

        del dict_args["attribute"]  # remove attribute element to show all data
        sql_text = query.get_cohort_data_sql(dict_args, clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/sizeUseDepletionScoreFilter", methods=["GET", "POST"])
@login_required
def size_cohort_depletion_score_filtered():
    # sizeUseDepletionScoreFilter?cohortId=3&table=depletionscore&attribute=rsa&ensg=ENSG00000141510&depletionscreen=Drive&ranges=gte_-0.1%lt_-0.01
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - table: the score table, which contains the attribute
    - attribute: the score attribute to filter
    - ensg: name of the gene
    - depletionscreen: name of the screen
    - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
        route="sizeUseDepletionScoreFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_depletion_score_filtered() function
        clone_cohort = query.create_cohort_depletion_score_filtered(
            dict_args, cohort, error_msg
        )  # get filtered cohort from dict_args and cohort

        sql_text = query.get_cohort_size_sql(clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/panelAnnotation", methods=["GET", "POST"])
@login_required
def panel_annotation():
    # panelAnnotation?cohortId=3&panel=TCGA normals
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameters are needed:
    - cohortId: id of the cohort, has to have a panel annotation
    - panel: name of the panel""".format(
        route="panelAnnotation"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        sql_text = query.get_panel_annotation_sql(request.values, cohort, error_msg)  # get sql statement for panel annotation
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement
    except RuntimeError as error:
        abort(400, error)


@app.route("/createUsePanelAnnotationFilter", methods=["GET", "POST"])
@login_required
def insert_cohort_panel_annotation_filtered():
    # createUsePanelAnnotationFilter?cohortId=1&name=testPanelAnno&panel=TCGA normals&values=true
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - name: name of the new cohort
    - panel: name of the panel
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="createUsePanelAnnotationFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
        new_cohort = query.create_cohort_panel_annotation_filtered(
            request.values, cohort, error_msg
        )  # get filtered cohort from args and cohort
        return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
    except RuntimeError as error:
        abort(400, error)


@app.route("/dataUsePanelAnnotationFilter", methods=["GET", "POST"])
@login_required
def data_cohort_panel_annotation_filtered():
    # dataUsePanelAnnotationFilter?cohortId=1&panel=TCGA normals&values=true
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - panel: name of the panel
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="dataUsePanelAnnotationFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_panel_annotation_filtered() function
        clone_cohort = query.create_cohort_panel_annotation_filtered(
            dict_args, cohort, error_msg
        )  # get filtered cohort from args and cohort

        sql_text = query.get_cohort_data_sql(dict_args, clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/sizeUsePanelAnnotationFilter", methods=["GET", "POST"])
@login_required
def size_cohort_panel_annotation_filtered():
    # sizeUsePanelAnnotationFilter?cohortId=1&panel=TCGA normals&values=true
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - panel: name of the panel
    - values: filter value(s) for the attribtue, separator '&#x2e31;', e.g. 'value1%26%23x2e31%3Bvalue2'""".format(
        route="sizeUsePanelAnnotationFilter"
    )

    try:
        query = QueryElements()
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

        dict_args = request.values.to_dict()  # convert ImmutableMultiDict to dict
        dict_args["name"] = "clone"  # add name element for the create_cohort_panel_annotation_filtered() function
        clone_cohort = query.create_cohort_panel_annotation_filtered(
            dict_args, cohort, error_msg
        )  # get filtered cohort from args and cohort

        sql_text = query.get_cohort_size_sql(clone_cohort)  # create sql statement from the cohort
        return query.execute_sql_query(sql_text, cohort.entity_database)  # execute sql statement

    except RuntimeError as error:
        abort(400, error)


@app.route("/hist", methods=["GET", "POST"])
@login_required
def hist():
    # hist?cohortId=2&type=dataCat&attribute=race
    # hist?cohortId=2&type=dataNum&attribute=age
    # hist?cohortId=2&type=geneScoreCat&attribute=aa_mutated&table=mutation&ensg=ENSG00000141510
    # hist?cohortId=2&type=geneScoreNum&attribute=relativecopynumber&table=copynumber&ensg=ENSG00000141510
    # hist?cohortId=3&type=depletionScore&attribute=rsa&table=depletionscore&ensg=ENSG00000141510&depletionscreen=Drive
    # hist?cohortId=2&type=panelAnnotation&panel=TCGA normals
    error_msg = """Paramerter missing or wrong!
    For the {route} query the following parameter is needed:
    - cohortId: id of the cohort parent cohort
    - type: dataCat | dataNum | geneScoreCat | geneScoreNum | depletionScore | panelAnnotation

    Depending on the 'type' different additional parameters have to exist
    --> Type: dataCat | dataNum
    - attribute: the entity attribute
    --> Type: geneScoreCat | geneScoreNum
    - table: the score table, which contains the attribute
    - attribute: the score attribute
    - ensg: name of the gene
    --> Type: depletionScore
    - table: the score table, which contains the attribute
    - attribute: the score attribute
    - ensg: name of the gene
    - depletionscreen: name of the screen
    --> Type: panelAnnotation
    - panel: name of the panel""".format(
        route="hist"
    )

    try:
        query = QueryElements()

        type = request.values.get("type")  # get type of hist
        if type is None:
            raise RuntimeError(error_msg)

        hist = jsonify([])
        cohort = query.get_cohort_from_db(request.values, error_msg)  # get cohort
        database = cohort.entity_database

        num_bins = 10
        if type == "dataCat":
            # - cohortId: id of the cohort
            # - attribute: the entity attribute
            sql_text = query.get_hist_cat_sql(request.values, cohort, error_msg)
            hist = query.execute_sql_query(sql_text, database, True, config.supp_statement_timeout)  # execute sql statement
        elif type == "dataNum":
            # - cohortId: id of the cohort
            # - attribute: the entity attribute
            sql_text = query.get_hist_num_sql(request.values, cohort, num_bins, error_msg)
            hist_dict = query.execute_sql_query_as_dict(sql_text, database, True, config.supp_statement_timeout)  # execute sql statement
            hist = query.format_num_hist(hist_dict, num_bins)
        elif type == "geneScoreCat":
            # - cohortId: id of the cohort
            # - table: the score table, which contains the attribute
            # - attribute: the score attribute
            # - ensg: name of the gene
            sql_text = query.get_hist_gene_cat_sql(request.values, cohort, error_msg)
            hist = query.execute_sql_query(sql_text, database, True, config.supp_statement_timeout)  # execute sql statement
        elif type == "geneScoreNum":
            # - cohortId: id of the cohort
            # - table: the score table, which contains the attribute
            # - attribute: the score attribute
            # - ensg: name of the gene
            sql_text = query.get_hist_gene_num_sql(request.values, cohort, num_bins, error_msg)
            hist_dict = query.execute_sql_query_as_dict(sql_text, database, True, config.supp_statement_timeout)  # execute sql statement
            hist = query.format_num_hist(hist_dict, num_bins)
        elif type == "depletionScore":
            # - cohortId: id of the cohort
            # - table: the score table, which contains the attribute
            # - attribute: the score attribute
            # - ensg: name of the gene
            # - depletionscreen: name of the screen
            sql_text = query.get_hist_depletion_sql(request.values, cohort, num_bins, error_msg)
            hist_dict = query.execute_sql_query_as_dict(sql_text, database, True, config.supp_statement_timeout)  # execute sql statement
            hist = query.format_num_hist(hist_dict, num_bins)
        elif type == "panelAnnotation":
            # - cohortId: id of the cohort
            # - panel: name of the panel
            sql_text = query.get_hist_panel_sql(request.values, cohort, error_msg)
            hist = query.execute_sql_query(sql_text, database, True, config.supp_statement_timeout)  # execute sql statement
        return hist

    except RuntimeError as error:
        abort(400, error)


@app.route("/recommendSplit", methods=["GET", "POST"])
# TODO add login_required
def recommendSplit():
  # error msg is wrong, it is based on the cohortData route
  # createUseNumFilter?cohortId=1&name=TeSt&attribute=age&ranges=gt_2%lte_5;gte_10
  error_msg = """Paramerter missing or wrong!
  For the {route} query the following parameter is needed:
  - cohortId: id of the cohort parent cohort
  - name: name of the new cohort
  - attribute: column used to filter
  - ranges: filter ranges for the attribute, e.g >2 and <=5, or >=10 -> gt_2%lte_5;gte_10""".format(
    route="createWithNumFilter"
  )

  # print("print test)") # is printed in the logs in docker
  # _log.debug("log debug test") # is printed in the logs with the DEBUG info
  # return "return test" # does not show in the log
  _log.debug("request.values")
  _log.debug(request.values)

  # todo: look at createUseNumFilter, size, hist routes. Try them here.
  # todo: get the tissue data that is currently used in the frontend, then apply a clustering algorithm, return the split (the bins that the user could also set themselves)

  # try:
  #   query = QueryElements()
  #   cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
  #   new_cohort = query.create_cohort_num_filtered(request.values, cohort,
  #                                                 error_msg)  # get filtered cohort from args and cohort
  #   return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
  # except RuntimeError as error:
  #   abort(400, error)

  # try:
  #   query = QueryElements()
  #   cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
  #   new_cohort = query.create_cohort_num_filtered(request.values, cohort,
  #                                                 error_msg)  # get filtered cohort from args and cohort
  #   return query.add_cohort_to_db(new_cohort)  # save new cohort into DB
  # except RuntimeError as error:
  #   abort(400, error)

  # based on cohortData
  try:
    query = QueryElements()
    cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort
    sql_text = query.get_cohort_data_sql(request.values, cohort)  # get sql statement to retrieve data


    query_results = query.execute_sql_query(sql_text, cohort.entity_database)
    # _log.debug("query_results %s ", query_results)
    # _log.debug("query_results.get_json() %s ", query_results.get_json()[0:3]) # returns the first row of the query results, e.g. {'age': 67.0, 'tissuename': 'GENIE-UHN-AGI523559-BM1'}
    # so I have the tissuenames of that cohort (TODO: there surely is a better way to get the tissuenames, without having to do this query, convert the response back to a dict etc etc)
    # I also have the attribute that is used for the cohort (e.g. age), so I can get the values of that attribute for each tissue and then cluster them
    # get the values of the attribute for each tissue
    # _log.debug("request.values['attribute'] %s ", request.values['attribute']) # returns the keys of the first row of the query results, e.g. dict_keys(['age', 'tissuename'])
    # get all the values of query_results.get_json() for the attribute
    # remove all none values
    tissues = [item for item in query_results.get_json() if item[request.values['attribute']] is not None]
    # _log.debug("tissues %s", tissues)

    # fit the clusterer based on the attribute values
    # _log.debug("type(tissues) %s", type(tissues))
    # convert the list tissues to a pandas dataframe
    tissues_df = pd.DataFrame(tissues)
    # this tissues_df consists of e.g. columns "age" and "tissuename", or "bmi" and "tissuename"
    # get only the first column of tissues_df (e.g. attribute age)
    # _log.debug("tissues_df %s", tissues_df)
    tissues_attribute_df = tissues_df.iloc[:, 0].values.reshape(-1, 1)
    _log.debug("tissues_attribute_df shape %s", tissues_attribute_df.shape)

    # # hdbscan
    # clusterer = hdbscan.HDBSCAN(min_cluster_size=round(tissues_attribute_df.shape[0]/10), gen_min_span_tree=True) # one tenth of the number of tissues, to get a reasonable amount of clusters
    # clusterer.fit(tissues_attribute_df)
    # # get the labels of the clusters
    # labels = clusterer.labels_
    # _log.debug("labels %s", labels)
    # # get the number of clusters by getting the distinct values of labels
    # n_clusters_ = len(set(labels))
    # _log.debug("n_clusters_ %s", n_clusters_)
    #
    # # log debug the attribute value and the cluster label
    # # for i in range(0, len(tissues_attribute_df)):
    # #   _log.debug("tissues_attribute_df[i] %s", tissues_attribute_df[i])
    # #   _log.debug("labels[i] %s", labels[i])
    #
    # # get the decision boundaries of the clusters
    # # get all incices of the tissue_attribute_df that have a certain label
    # # hdbscan end

    # kmeans

    # get the optimal number of clusters
    n_clusters_range = range(2, 60) # arbitrarily chosen (talk to the user about this)

    # # Calculate silhouette scores for different k values
    # # silhouette scores are NOT feasible for large datasets, so this is not a good approach
    # silhouette_scores = []
    # for k in n_clusters_range:
    #   _log.debug("goes into the loop with k=%s", k)
    #   clusterer_attribute_kmeans = KMeans(n_clusters=k, n_init='auto')
    #   clusterer_attribute_kmeans.fit(tissues_attribute_df)
    #   labels = clusterer_attribute_kmeans.labels_
    #   silhouette_scores.append(silhouette_score(tissues_attribute_df, labels))
    # # # Find the index of the maximum silhouette score
    # _log.debug("silhouette_scores %s", silhouette_scores)
    # # optimal_k_index = silhouette_scores.index(max(silhouette_scores))
    # # optimal_k = n_clusters_range[optimal_k_index]

    # Calculate within-cluster sum of squares (inertia) for different k values
    inertia_values = []
    for k in n_clusters_range:
      kmeans = KMeans(n_clusters=k, n_init='auto')
      kmeans.fit(tissues_attribute_df)
      inertia_values.append(kmeans.inertia_)

    # Calculate the rate of change of inertia
    # Inertia measures how well a dataset was clustered by K-Means. It is calculated by measuring the distance between each data point and its centroid, squaring this distance, and summing these squares across one cluster.
    # https://www.codecademy.com/learn/machine-learning/modules/dspath-clustering/cheatsheet
    rate_of_change = np.diff(inertia_values)  # rate of change from 1 to 2, 2 to 3, etc

    # Find the "elbow point" where the rate of change starts to slow down
    # Calculate the "elbow point" where the rate of change slows down
    # if no elbow_point is found, the last index of inertia_values is chosen
    elbow_point = len(inertia_values) - 1

    _log.debug("rate_of_change %s", rate_of_change)
    _log.debug("inertia_values %s", inertia_values)

    for i in range(len(rate_of_change) - 1):
      diff1 = rate_of_change[i]
      diff2 = rate_of_change[i + 1]
      change_ratio = diff2 / diff1
      _log.debug("change_ratio %s", change_ratio)
      if change_ratio < 0.1:  # this is an "arbitrary" threshold. The smaller the threshold, the more clusters are chosen
        elbow_point = i  # the rate_of_change show e.g. the change from 3 clusters to 4 cluster in index 2 of rate_of_change.
        # so the elbow point is the index of the rate_of_change where the change from e.g. 3 to 4 is not big anymore: index 2. 3 clusters is a good amount of clusters.
        break

    optimal_k = n_clusters_range[elbow_point]  # e.g. at the elbow point: 2 the number of clusters is 3

    # TODO: somehow, for this data, this approach does not work. The change_ratio does not start high and go down, but is e.g. 0.40, 0.49, 0.61, 0.63, 0.59, 0.79, 0.49, 1.37, etc

    _log.debug("Optimal number of clusters: %s", optimal_k)
    # do the clustering with the optimal number of clusters
    clusterer_attribute_kmeans = KMeans(n_clusters=optimal_k, n_init='auto')
    clusterer_attribute_kmeans.fit(tissues_attribute_df)

    # get the labels of the clusters
    labels = clusterer_attribute_kmeans.labels_
    _log.debug("labels %s", labels)
    # get the number of clusters by getting the distinct values of labels
    n_clusters_ = len(set(labels))
    _log.debug("n_clusters_ %s", n_clusters_)
    # kmeans end
    _log.debug("tissues_attribute_df %s", tissues_attribute_df.shape)
    _log.debug("tissues_attribute_df %s", clusterer_attribute_kmeans.labels_.shape)

    # add the cluster labels to the tissues
    _log.debug("tissues_df %s", tissues_df)
    tissues_df['cluster_label'] = labels
    _log.debug("tissues_df %s", tissues_df)

    # get the decision boundaries of the clusters
    min_cluster_list = []
    max_cluster_list = []
    for i in range(0, n_clusters_):
      # it is a 1d array --> we can find the decision boundaries by looking at the maximum of the smaller cluster and the minimum of the larger cluster
      min_cluster_list.append(min(tissues_df[tissues_df['cluster_label'] == i][request.values['attribute']]))
      max_cluster_list.append(max(tissues_df[tissues_df['cluster_label'] == i][request.values['attribute']]))
    min_cluster_list.sort()
    max_cluster_list.sort()
    _log.debug("min_cluster_list %s", min_cluster_list)
    _log.debug("max_cluster_list %s", max_cluster_list)

    # store the boundaries in a list
    boundaries = []
    # make this generic for any amount of clusters
    for i in range(0, n_clusters_-1):
      boundaries.append((max_cluster_list[i] + min_cluster_list[i+1]) / 2)
    _log.debug("boundaries %s", boundaries)
    # kmeans end

    return jsonify(boundaries)
  except RuntimeError as error:
    abort(400, error)



@app.route("/createAutomatically", methods=["GET", "POST"])
# TODO add login_required
def create_automatically():
  # error msg is wrong, it is based on the cohortData route
  # cohortData?cohortId=2&attribute=genderdata
  error_msg = """Paramerter missing or wrong!
  For the {route} query the following parameter is needed:
  - cohortId: id of the cohort
  There are also  optional parameters:
  - attribute0: one column of the entity table, used when called for 2 attributes
  - attribute0type: type of the attribute0
  - attribute1: one column of the entity table, used when called for 2 attributes
  - attribute1type: type of the attribute1
  - attribute: one column of the entity table""".format(
    route="cohortData"
  )

  _log.debug("request.values %s", request.values)

  # based on createUseNumFilter and create cohorts with hdbscan clustering
  try:
    # different implementations based on different parameters
    # if there is just one (numerical) attribute, use hdbscan
    # if there are two (numerical) attributes, use hdbscan
    # if there is one categorical and one numerical attribute, use k-prototypes
    HDBSCAN = "hdbscan"
    K_PROTOTYPES = "k-prototypes"
    cluster_method = None
    
    query = QueryElements()
    cohort = query.get_cohort_from_db(request.values, error_msg)  # get parent cohort

    if "attribute0" in request.values and not "attribute1" in request.values:
        # one (numerical) attriubte
        cluster_method = HDBSCAN
        sql_text = query.get_cohort_data_sql({"attribute": request.values["attribute0"]}, cohort)  # get sql statement to retrieve data
        attribute0 = {"dataKey": request.values["attribute0"], "type": request.values["attribute0type"]}
        query_results = query.execute_sql_query(sql_text, cohort.entity_database)
        tissues = [item for item in query_results.get_json() if item[attribute0["dataKey"]] is not None]
        tissues_df = pd.DataFrame(tissues)
        tissues_attribute_df = tissues_df[attribute0["dataKey"]].values.reshape(-1, 1)
    elif "attribute0" in request.values and "attribute1" in request.values:
        # two attributes
        if request.values["attribute0type"] == "number" and request.values["attribute1type"] == "number":
            # two numerical attributes
            cluster_method = HDBSCAN
            sql_text = query.get_cohort_data_multi_attr_sql(request.values, cohort)  # get sql statement to retrieve data
            query_results = query.execute_sql_query(sql_text, cohort.entity_database)
            attribute0 = {"dataKey": request.values["attribute0"], "type": request.values["attribute0type"]}
            attribute1 = {"dataKey": request.values["attribute1"], "type": request.values["attribute1type"]}
            tissues = [item for item in query_results.get_json() if item[attribute0["dataKey"]] is not None and item[attribute1["dataKey"]] is not None]
            tissues_df = pd.DataFrame(tissues)
            tissues_attribute_df = tissues_df[[attribute0["dataKey"], attribute1["dataKey"]]].values
        elif request.values["attribute0type"] == "categorical" and request.values["attribute1type"] == "number" or request.values["attribute0type"] == "number" and request.values["attribute1type"] == "categorical":
            cluster_method = K_PROTOTYPES
     


    # fit the clusterer based on the attribute values

    # 1 or 2 numerical attributes ==> hdbscan
    if cluster_method == HDBSCAN:
        clusterer = hdbscan.HDBSCAN(min_cluster_size=round(tissues_attribute_df.shape[0]/50), gen_min_span_tree=True) # one tenth of the number of tissues, to get a reasonable amount of clusters
        # TODO: how to find a useful min_cluster_size? also: return useful error message if this gets too small somehow
        clusterer.fit(tissues_attribute_df)
        # get the labels of the clusters
        labels = clusterer.labels_
        _log.debug("labels %s", labels)
        # get the number of clusters by getting the distinct values of labels
        n_clusters_ = len(set(labels))
        _log.debug("n_clusters_ %s", n_clusters_)

        # create a cohort for each cluster
        # add the cluster labels to the tissues
        tissues_df["cluster_label"] = labels
        _log.debug("tissues_df %s", tissues_df)

        # get all the tissuenames for each cluster
        _log.debug("tissues[0] with label %s", tissues[0])
        _log.debug("tissues_df[tissues_df['cluster_label'] == 0] %s", tissues_df[tissues_df["cluster_label"] == 0])
        # loop over every cluster
        # get the distinct values of the cluster_label
        _log.debug("set(labels) %s", set(labels))

        # create a cohort for each cluster
        cohortids = []
        for i in set(labels):
        clusters_tissuenames = tissues_df[tissues_df["cluster_label"] == i]["tissuename"].tolist()
        _log.debug("cohortdebuggg %s", cohort)
        # change the statement to use  the ids of the cohorts
        # Convert the list into a comma-separated string
        sql_values = "(" + ", ".join(["'" + item + "'" for item in clusters_tissuenames]) + ")"
        sql_text = "SELECT p.* FROM (SELECT * FROM tissue.tdp_tissue) p WHERE (p.tissuename IN {tissuenames})".format(tissuenames=(sql_values)) # TODO: make this generic for other table, multiple attributes etc
        # _log.debug("sql_text %s", sql_text)
        cohort.statement = sql_text
        # _log.debug("cohortdebuggg %s", cohort)

        new_cohort = query.create_cohort_automatically_from_tissue_names(request.values, cohort,
                                                        error_msg)  # get filtered cohort from args and cohort
        _log.debug("new_cohort %s", new_cohort)
        returnvalue = query.add_cohort_to_db(new_cohort).data # save new cohort into DB
        # Convert bytes to integers and remove brackets
        returnvalue = int(returnvalue.decode("utf-8").strip("[]\n")) # this is a workaround to undo the jsonify that is done in add_cohort_to_db
        cohortids.append(returnvalue)
        _log.debug("cohortids now %s", cohortids)

        # hdbscan end
    elif cluster_method == K_PROTOTYPES:
        # todo: implement
        # 1 categorical and 1 numerical attribute ==> k-prototypes
        return "not implemented yet"
    _log.debug("cohortids %s", cohortids)
    return jsonify(cohortids)
  except RuntimeError as error:
    abort(400, error)



def create():
    """
    entry point of this plugin
    """
    # app.debug = True
    return app
