###############################################################################
# Caleydo - Visualization for Molecular Biology - http://caleydo.org
# Copyright (c) The Caleydo Team. All rights reserved.
# Licensed under the new BSD license, available at http://caleydo.org/license
###############################################################################
from os import path
from typing import Type

from pydantic import BaseModel
from tdp_core.plugin.model import AVisynPlugin, RegHelper

from .settings import CoralSettings

PROJ_NAME = "coral"
DB_KEY = "cohortdb"


class VisynPlugin(AVisynPlugin):
    def register(self, registry: RegHelper):
        registry.append("tdp-sql-database-definition", "cohortdb", "coral.db", {"configKey": "coral"})

        registry.append("namespace", "db_connector", "coral.sql", {"namespace": "/api/cohortdb/db"})

        registry.append(
            "tdp-sql-database-migration",
            DB_KEY,
            "",
            {
                "scriptLocation": path.join(path.abspath(path.dirname(__file__)), "migration"),
                "configKey": f"{PROJ_NAME}.migration",
                "dbKey": DB_KEY,
                "versionTableSchema": "public",
            },
        )

    @property
    def setting_class(self) -> Type[BaseModel]:
        return CoralSettings
