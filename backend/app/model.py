from operator import itemgetter
from typing import Dict, List

from adh_sample_library_preview import (
    MetadataItem,
    SdsExtrapolationMode,
    SdsInterpolationMode,
    SdsStream,
    SdsType,
    SdsTypeCode,
    SdsTypeProperty,
    StreamReference,
    TypeReference,
)
from adh_sample_library_preview.Asset import Asset, AssetType
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .client import NAMESPACE_ID, get_adh_client

ML_MODEL_TYPE_ID = "model_forecast_double"
ML_MODEL_TYPE_NAME = "model_forecast_double"
ML_MODEL_TYPE_DESCRIPTION = "Data Model for Forecast"
ML_MODEL_ASSET_TYPE_QUERY = "AssetTypeId:Forecast"
# DEFAULT_MODEL_TYPE = "LinearRegressionModel"
ML_FORECAST_MODEL_ID = "Forecast"


def create_meta_dict(items: Dict, id: str, type: SdsTypeCode, value=None):
    items[id] = create_meta(id, type, value)


def create_meta(id: str, type: SdsTypeCode, value=None):
    meta_data = MetadataItem(
        id=id,
        sds_type_code=type,
    )
    if value:
        meta_data.Value = value
    return meta_data


def list2string(values):
    if values:
        if isinstance(values, list):
            return ",".join(values)
    return ""


def add_references(references: List, additions: List, prefix: str):
    client = get_adh_client()
    for i in range(len(additions)):
        stream = client.Streams.getStream(NAMESPACE_ID, additions[i])
        stream_reference = StreamReference(
            stream.Id, stream.Name, stream.Id, stream.Description
        )
        references.append(stream_reference)


def create_ml_forecast_type() -> AssetType:
    """Create or update ML model asset type."""
    client = get_adh_client()
    asset_type = AssetType(
        ML_FORECAST_MODEL_ID, "Forecast", "Base model for ML timeseries forecast"
    )

    metadata = [
        create_meta("model_type", SdsTypeCode.String, ""),
        create_meta("interval", SdsTypeCode.Int64, 0),
        create_meta("past", SdsTypeCode.String, ""),
        create_meta("target", SdsTypeCode.String, ""),
        create_meta("future", SdsTypeCode.String, ""),
        create_meta("status", SdsTypeCode.String, ""),
        create_meta("lag", SdsTypeCode.Int64, 0),
        create_meta("lead", SdsTypeCode.Int64, 0),
        create_meta("update", SdsTypeCode.String, ""),
        create_meta("retrain", SdsTypeCode.String, ""),
    ]
    asset_type.Metadata = metadata
    asset_type = client.AssetTypes.createOrUpdateAssetType(NAMESPACE_ID, asset_type)

    return asset_type


def create_ml_double_type():
    """Create ML forecasting type with predefined structure."""
    client = get_adh_client()
    time_type = SdsType("string", SdsTypeCode.DateTime)
    double_type = SdsType("doubleType", SdsTypeCode.Double)

    # Define properties for basic forecasting
    timestamp = SdsTypeProperty("Timestamp", True, time_type)
    value = SdsTypeProperty("Value", False, double_type)
    ml_type = SdsType(
        ML_MODEL_TYPE_ID,
        SdsTypeCode.Object,
        [timestamp, value],
        ML_MODEL_TYPE_NAME,
        ML_MODEL_TYPE_DESCRIPTION,
    )
    return client.Types.getOrCreateType(NAMESPACE_ID, ml_type)


def create_ml_type():
    """Create ML forecasting type with predefined structure."""
    client = get_adh_client()
    time_type = SdsType("string", SdsTypeCode.DateTime)
    double_type = SdsType("doubleType", SdsTypeCode.Double)
    array_type = SdsType("arrayType", SdsTypeCode.DoubleArray)

    # Define properties for basic forecasting
    timestamp = SdsTypeProperty("Timestamp", True, time_type)
    forecast = SdsTypeProperty("Forecast", False, double_type)
    lower = SdsTypeProperty("Lower", False, double_type)
    upper = SdsTypeProperty("Upper", False, double_type)
    weight = SdsTypeProperty("Weight", False, array_type)
    ml_type = SdsType(
        ML_MODEL_TYPE_ID,
        SdsTypeCode.Object,
        [timestamp, forecast, lower, upper, weight],
        ML_MODEL_TYPE_NAME,
        ML_MODEL_TYPE_DESCRIPTION,
    )
    return client.Types.getOrCreateType(NAMESPACE_ID, ml_type)


def create_ml_asset(
    id: str,
    name: str,
    description: str,
    model_type: str,
    interval: int,
    past: List[str],
    target: List[str],
    future: List[str],
    status: List[str],
    lag: int,
    lead: int,
    update: str,
    retrain: str,
):
    client = get_adh_client()
    # Ensure unique stream references
    unique = set()
    for vars in [target, future, past, status]:
        tmp = []
        for var in vars:
            if var in unique:
                continue
            tmp.append(var)
            unique.add(var)
        vars.clear()
        vars.extend(tmp)

    metadata = [
        create_meta("model_type", SdsTypeCode.String, model_type),
        create_meta("interval", SdsTypeCode.Int64, interval),
        create_meta("past", SdsTypeCode.String, list2string(past)),
        create_meta("target", SdsTypeCode.String, list2string(target)),
        create_meta("future", SdsTypeCode.String, list2string(future)),
        create_meta("status", SdsTypeCode.String, list2string(status)),
        create_meta("lag", SdsTypeCode.Int64, lag),
        create_meta("lead", SdsTypeCode.Int64, lead),
        create_meta("update", SdsTypeCode.String, update),
        create_meta("retrain", SdsTypeCode.String, retrain),
    ]
    stream_references = []

    add_references(stream_references, target, f"target_{id}")
    add_references(stream_references, future, f"future_{id}")
    add_references(stream_references, past, f"past_{id}")
    add_references(stream_references, status, f"status_{id}")

    ml_double_type = create_ml_double_type()
    for forecast in ["Forecast", "Forecast Lower", "Forecast Upper"]:
        stream_id = f"{id} {forecast}"
        ml_stream = SdsStream(
            stream_id,
            ml_double_type.Id,
            f"IndyIQ ML {forecast}",
            f"IndyIQ ML {forecast}",
            interpolation_mode=SdsInterpolationMode.Continuous,
            extrapolation_mode=SdsExtrapolationMode.All,
        )
        ml_stream = client.Streams.getOrCreateStream(NAMESPACE_ID, ml_stream)
        stream_reference = StreamReference(
            forecast,
            ml_stream.Name,
            ml_stream.Id,
            ml_stream.Description,
        )
        stream_references.append(stream_reference)
    asset_type = create_ml_forecast_type()
    asset = Asset(id=id, name=name, description=description)
    asset.StreamReferences = stream_references
    asset.Metadata = metadata
    asset.AssetTypeId = asset_type.Id
    return client.Assets.createOrUpdateAsset(NAMESPACE_ID, asset)
