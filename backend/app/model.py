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

ML_MODEL_TYPE_ID = "model_forecast"
ML_MODEL_TYPE_NAME = "model_forecast"
ML_MODEL_TYPE_DESCRIPTION = "Data Model for Forecast"
ML_MODEL_ASSET_TYPE_QUERY = "AssetTypeId:Forecast"
# DEFAULT_MODEL_TYPE = "LinearRegressionModel"
ML_FORECAST_MODEL_ID = "Forecast"


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
            f"{prefix}_{i}", stream.Name, stream.Id, stream.Description
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
        create_meta("sampling_rate", SdsTypeCode.Int64, 0),
        create_meta("training_horizon", SdsTypeCode.Int64, 0),
        create_meta("past_covariates", SdsTypeCode.String, ""),
        create_meta("target", SdsTypeCode.String, ""),
        create_meta("future_covariates", SdsTypeCode.String, ""),
        create_meta("status", SdsTypeCode.String, ""),
        create_meta("forecast_horizon", SdsTypeCode.Int64, 0),
        create_meta("update_frequency", SdsTypeCode.Int64, 0),
        create_meta("retrain_frequency", SdsTypeCode.Int64, 0),
    ]
    asset_type.Metadata = metadata
    asset_type = client.AssetTypes.createOrUpdateAssetType(NAMESPACE_ID, asset_type)

    return asset_type


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
    sampling_rate: int,
    past_covariates: List[str],
    target: List[str],
    future_covariates: List[str],
    status: List[str],
    training_horizon: int,
    forecast_horizon: int,
    update_frequency: int,
    retrain_frequency: int,
):
    client = get_adh_client()
    metadata = [
        create_meta("model_type", SdsTypeCode.String, model_type),
        create_meta("sampling_rate", SdsTypeCode.Int64, sampling_rate),
        create_meta(
            "past_covariates", SdsTypeCode.String, list2string(past_covariates)
        ),
        create_meta("target", SdsTypeCode.String, list2string(target)),
        create_meta(
            "future_covariates", SdsTypeCode.String, list2string(future_covariates)
        ),
        create_meta("status", SdsTypeCode.String, list2string(status)),
        create_meta("training_horizon", SdsTypeCode.Int64, training_horizon),
        create_meta("forecast_horizon", SdsTypeCode.Int64, forecast_horizon),
        create_meta("update_frequency", SdsTypeCode.Int64, update_frequency),
        create_meta("retrain_frequency", SdsTypeCode.Int64, retrain_frequency),
    ]
    ml_type = create_ml_type()
    asset_type = create_ml_forecast_type()
    # Create stream
    stream_id = f"{id}_stream"
    ml_stream = SdsStream(
        stream_id,
        ml_type.Id,
        "ML Stream",
        "ML Stream",
        interpolation_mode=SdsInterpolationMode.Continuous,
        extrapolation_mode=SdsExtrapolationMode.All,
    )
    stream_references = []
    add_references(stream_references, past_covariates, f"past_covariates_{id}_")
    add_references(stream_references, target, f"target_{id}_")
    add_references(stream_references, future_covariates, f"future_covariates_{id}_")
    add_references(stream_references, status, f"status_{id}_")
    ml_stream = client.Streams.getOrCreateStream(NAMESPACE_ID, ml_stream)
    stream_reference = StreamReference(
        "result", ml_stream.Name, ml_stream.Id, ml_stream.Description
    )
    stream_references.append(stream_reference)
    asset = Asset(id=id, name=name, description=description)
    asset.StreamReferences = stream_references
    asset.Metadata = metadata
    asset.AssetTypeId = asset_type.Id
    return client.Assets.createOrUpdateAsset(NAMESPACE_ID, asset)
